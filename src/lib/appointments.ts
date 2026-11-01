import { createAdminClient } from "@/lib/supabase/admin";
import { timeToMinutes, weekdayOf } from "@/lib/validation";

export type AppointmentRow = {
  id: number;
  date: string;
  start_time: string;
  patient_name: string;
  dni: string;
  obra_social: string;
  phone: string | null;
  status: string;
};

export function toApiAppointment(row: AppointmentRow) {
  return {
    id: row.id,
    date: row.date,
    startTime: row.start_time.slice(0, 5), // "09:30:00" -> "09:30"
    patientName: row.patient_name,
    dni: row.dni,
    obraSocial: row.obra_social,
    phone: row.phone,
    status: row.status,
  };
}

// Verifica que la fecha no esté bloqueada y que el horario caiga en un espacio del patrón semanal.
export async function checkSlotAvailable(
  date: string,
  startTime: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const admin = createAdminClient();

  const { data: blocked, error: blockedError } = await admin
    .from("blocked_dates")
    .select("date")
    .eq("date", date)
    .maybeSingle();
  if (blockedError) throw blockedError;
  if (blocked) return { ok: false, message: "La fecha está bloqueada" };

  const { data: ranges, error: rangesError } = await admin
    .from("weekly_schedule")
    .select("start_time, end_time, slot_minutes")
    .eq("weekday", weekdayOf(date));
  if (rangesError) throw rangesError;

  const t = timeToMinutes(startTime);
  const fits = (ranges ?? []).some((r) => {
    const start = timeToMinutes(r.start_time.slice(0, 5));
    const end = timeToMinutes(r.end_time.slice(0, 5));
    return t >= start && t + r.slot_minutes <= end && (t - start) % r.slot_minutes === 0;
  });
  if (!fits) return { ok: false, message: "El horario no está dentro de la atención" };

  return { ok: true };
}