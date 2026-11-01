import { NextResponse } from "next/server";
import { apiError, requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidDate, timeToMinutes, weekdayOf } from "@/lib/validation";

const MAX_DAYS = 62;

function addDays(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

function minutesToTime(min: number): string {
  const h = String(Math.floor(min / 60)).padStart(2, "0");
  const m = String(min % 60).padStart(2, "0");
  return `${h}:${m}`;
}

export async function GET(request: Request) {
  const auth = await requireRole(["secretaria"]);
  if (!auth.ok) return auth.response;

  const params = new URL(request.url).searchParams;
  const from = params.get("from");
  const to = params.get("to") ?? from;
  if (!isValidDate(from) || !isValidDate(to)) {
    return apiError(400, "VALIDATION_ERROR", "from y to deben tener formato YYYY-MM-DD");
  }
  if (to < from) {
    return apiError(400, "VALIDATION_ERROR", "to no puede ser anterior a from");
  }

  const dates: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    dates.push(d);
    if (dates.length > MAX_DAYS) {
      return apiError(400, "VALIDATION_ERROR", `El rango máximo es de ${MAX_DAYS} días`);
    }
  }

  const admin = createAdminClient();
  const [rangesRes, blockedRes, apptsRes] = await Promise.all([
    admin.from("weekly_schedule").select("weekday, start_time, end_time, slot_minutes"),
    admin.from("blocked_dates").select("date").gte("date", from).lte("date", to),
    admin
      .from("appointments")
      .select("id, date, start_time, patient_name, dni, obra_social, phone, status")
      .gte("date", from)
      .lte("date", to)
      .neq("status", "cancelado"),
  ]);
  if (rangesRes.error || blockedRes.error || apptsRes.error) {
    return apiError(500, "INTERNAL_ERROR", "No se pudo calcular la disponibilidad");
  }

  const ranges = rangesRes.data ?? [];
  const blocked = new Set((blockedRes.data ?? []).map((b) => b.date));
  const appts = new Map(
    (apptsRes.data ?? []).map((a) => [`${a.date}|${String(a.start_time).slice(0, 5)}`, a])
  );

  const days = dates.map((date) => {
    if (blocked.has(date)) return { date, blocked: true, slots: [] };

    const minutes = new Set<number>();
    for (const r of ranges.filter((x) => x.weekday === weekdayOf(date))) {
      const start = timeToMinutes(String(r.start_time).slice(0, 5));
      const end = timeToMinutes(String(r.end_time).slice(0, 5));
      for (let t = start; t + r.slot_minutes <= end; t += r.slot_minutes) minutes.add(t);
    }

    const slots = Array.from(minutes)
      .sort((a, b) => a - b)
      .map((t) => {
        const startTime = minutesToTime(t);
        const a = appts.get(`${date}|${startTime}`);
        if (!a) return { startTime, status: "libre" };
        return {
          startTime,
          status: a.status,
          appointment: {
            id: a.id,
            patientName: a.patient_name,
            dni: a.dni,
            obraSocial: a.obra_social,
            phone: a.phone,
          },
        };
      });

    return { date, blocked: false, slots };
  });

  return NextResponse.json({ days });
}