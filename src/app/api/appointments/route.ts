import { NextResponse } from "next/server";
import { apiError, requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidDate, isValidTime } from "@/lib/validation";
import { checkSlotAvailable, toApiAppointment } from "@/lib/appointments";

export async function POST(request: Request) {
  const auth = await requireRole(["secretaria"]);
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    if (typeof parsed !== "object" || parsed === null) throw new Error();
    body = parsed as Record<string, unknown>;
  } catch {
    return apiError(400, "VALIDATION_ERROR", "Cuerpo JSON inválido");
  }

  const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const date = body.date;
  const startTime = body.startTime;
  const patientName = text(body.patientName);
  const dni = text(body.dni);
  const obraSocial = text(body.obraSocial);
  const phone = text(body.phone) || null;

  if (!isValidDate(date)) return apiError(400, "VALIDATION_ERROR", "Fecha inválida (YYYY-MM-DD)");
  if (!isValidTime(startTime)) return apiError(400, "VALIDATION_ERROR", "Hora inválida (HH:mm)");
  if (!patientName) return apiError(400, "VALIDATION_ERROR", "El nombre del paciente es obligatorio");
  if (!/^\d{6,10}$/.test(dni)) return apiError(400, "VALIDATION_ERROR", "El DNI debe tener solo números (6 a 10 dígitos)");
  if (!obraSocial) return apiError(400, "VALIDATION_ERROR", "La obra social es obligatoria");

  const availability = await checkSlotAvailable(date, startTime);
  if (!availability.ok) return apiError(422, "SLOT_NOT_AVAILABLE", availability.message);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("appointments")
    .insert({
      date,
      start_time: startTime,
      patient_name: patientName,
      dni,
      obra_social: obraSocial,
      phone,
    })
    .select()
    .single();

  if (error) {
    // 23505 = violación del índice único: el horario ya lo ocupa otro turno no cancelado
    if (error.code === "23505") return apiError(409, "SLOT_TAKEN", "El horario ya está ocupado");
    return apiError(500, "INTERNAL_ERROR", "No se pudo crear el turno");
  }

  return NextResponse.json({ appointment: toApiAppointment(data) }, { status: 201 });
}