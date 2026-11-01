import { NextResponse } from "next/server";
import { apiError, requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidTime, timeToMinutes } from "@/lib/validation";
import { slotFitsRanges, todayInArgentina, type Range } from "@/lib/schedule";

export async function GET() {
  const auth = await requireRole(["secretaria"]);
  if (!auth.ok) return auth.response;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("weekly_schedule")
    .select("weekday, start_time, end_time, slot_minutes")
    .order("weekday", { ascending: true })
    .order("start_time", { ascending: true });
  if (error) return apiError(500, "INTERNAL_ERROR", "No se pudo leer el horario");

  return NextResponse.json({
    ranges: (data ?? []).map((r) => ({
      weekday: r.weekday,
      startTime: String(r.start_time).slice(0, 5),
      endTime: String(r.end_time).slice(0, 5),
      slotMinutes: r.slot_minutes,
    })),
  });
}

export async function PUT(request: Request) {
  const auth = await requireRole(["secretaria"]);
  if (!auth.ok) return auth.response;

  let rawRanges: unknown;
  try {
    rawRanges = (await request.json())?.ranges;
  } catch {
    return apiError(400, "VALIDATION_ERROR", "Cuerpo JSON inválido");
  }
  if (!Array.isArray(rawRanges)) {
    return apiError(400, "VALIDATION_ERROR", "ranges debe ser una lista");
  }

  const ranges: Range[] = [];
  for (const item of rawRanges) {
    const r = (item ?? {}) as Record<string, unknown>;
    const weekday = r.weekday;
    const startTime = r.startTime;
    const endTime = r.endTime;
    const slotMinutes = r.slotMinutes;

    if (typeof weekday !== "number" || !Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
      return apiError(400, "VALIDATION_ERROR", "weekday debe ser un entero entre 0 (domingo) y 6 (sábado)");
    }
    if (!isValidTime(startTime) || !isValidTime(endTime)) {
      return apiError(400, "VALIDATION_ERROR", "startTime y endTime deben tener formato HH:mm");
    }
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      return apiError(400, "VALIDATION_ERROR", "endTime debe ser posterior a startTime");
    }
    if (typeof slotMinutes !== "number" || !Number.isInteger(slotMinutes) || slotMinutes < 5 || slotMinutes > 240) {
      return apiError(400, "VALIDATION_ERROR", "slotMinutes debe ser un entero entre 5 y 240");
    }
    ranges.push({ weekday, startTime, endTime, slotMinutes });
  }

  // Los rangos de un mismo día no pueden solaparse
  for (let day = 0; day <= 6; day++) {
    const list = ranges
      .filter((r) => r.weekday === day)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    for (let i = 1; i < list.length; i++) {
      if (timeToMinutes(list[i].startTime) < timeToMinutes(list[i - 1].endTime)) {
        return apiError(400, "VALIDATION_ERROR", "Hay rangos solapados en un mismo día");
      }
    }
  }

  const admin = createAdminClient();

  // Turnos futuros que quedarían fuera del nuevo horario: la secretaria debe resolverlos antes
  const { data: future, error: futureError } = await admin
    .from("appointments")
    .select("id, date, start_time, patient_name, status")
    .gte("date", todayInArgentina())
    .neq("status", "cancelado")
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });
  if (futureError) return apiError(500, "INTERNAL_ERROR", "No se pudieron revisar los turnos");

  const conflicts = (future ?? []).filter(
    (a) => !slotFitsRanges(a.date, String(a.start_time).slice(0, 5), ranges)
  );
  if (conflicts.length > 0) {
    return NextResponse.json(
      {
        error: {
          code: "CONFLICTS_PENDING",
          message: "Hay turnos que quedarían fuera del nuevo horario y deben resolverse antes",
          details: {
            appointments: conflicts.map((a) => ({
              id: a.id,
              date: a.date,
              startTime: String(a.start_time).slice(0, 5),
              patientName: a.patient_name,
              status: a.status,
            })),
          },
        },
      },
      { status: 409 }
    );
  }

  // Se inserta primero el patrón nuevo y después se borra el anterior: si algo falla, no se pierde el horario
  const { data: old, error: oldError } = await admin.from("weekly_schedule").select("id");
  if (oldError) return apiError(500, "INTERNAL_ERROR", "No se pudo leer el horario actual");

  if (ranges.length > 0) {
    const { error: insertError } = await admin.from("weekly_schedule").insert(
      ranges.map((r) => ({
        weekday: r.weekday,
        start_time: r.startTime,
        end_time: r.endTime,
        slot_minutes: r.slotMinutes,
      }))
    );
    if (insertError) return apiError(500, "INTERNAL_ERROR", "No se pudo guardar el horario");
  }

  const oldIds = (old ?? []).map((o) => o.id);
  if (oldIds.length > 0) {
    const { error: deleteError } = await admin.from("weekly_schedule").delete().in("id", oldIds);
    if (deleteError) return apiError(500, "INTERNAL_ERROR", "No se pudo reemplazar el horario anterior");
  }

  return NextResponse.json({ ranges });
}