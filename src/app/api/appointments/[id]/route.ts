import { NextResponse } from "next/server";
import { apiError, requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidDate, isValidTime } from "@/lib/validation";
import { checkSlotAvailable, toApiAppointment } from "@/lib/appointments";
import { parseId } from "@/lib/appointment-rules";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["secretaria"]);
  if (!auth.ok) return auth.response;

  const id = parseId((await params).id);
  if (id === null) return apiError(400, "VALIDATION_ERROR", "Id inválido");

  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    if (typeof parsed !== "object" || parsed === null) throw new Error();
    body = parsed as Record<string, unknown>;
  } catch {
    return apiError(400, "VALIDATION_ERROR", "Cuerpo JSON inválido");
  }

  const admin = createAdminClient();
  const { data: current, error: findError } = await admin
    .from("appointments")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (findError) return apiError(500, "INTERNAL_ERROR", "No se pudo leer el turno");
  if (!current) return apiError(404, "NOT_FOUND", "El turno no existe");
  if (current.status === "cancelado") {
    return apiError(409, "INVALID_STATE", "Un turno cancelado no se puede modificar");
  }

  const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const update: Record<string, unknown> = {};

  if ("date" in body) {
    if (!isValidDate(body.date)) return apiError(400, "VALIDATION_ERROR", "Fecha inválida (YYYY-MM-DD)");
    update.date = body.date;
  }
  if ("startTime" in body) {
    if (!isValidTime(body.startTime)) return apiError(400, "VALIDATION_ERROR", "Hora inválida (HH:mm)");
    update.start_time = body.startTime;
  }
  if ("patientName" in body) {
    const v = text(body.patientName);
    if (!v) return apiError(400, "VALIDATION_ERROR", "El nombre del paciente es obligatorio");
    update.patient_name = v;
  }
  if ("dni" in body) {
    const v = text(body.dni);
    if (!/^\d{6,10}$/.test(v)) return apiError(400, "VALIDATION_ERROR", "El DNI debe tener solo números (6 a 10 dígitos)");
    update.dni = v;
  }
  if ("obraSocial" in body) {
    const v = text(body.obraSocial);
    if (!v) return apiError(400, "VALIDATION_ERROR", "La obra social es obligatoria");
    update.obra_social = v;
  }
  if ("phone" in body) {
    update.phone = text(body.phone) || null;
  }

  if (Object.keys(update).length === 0) {
    return apiError(400, "VALIDATION_ERROR", "No hay campos para modificar");
  }

  // Solo se revalida la disponibilidad si cambia fecha u hora
  const currentTime = String(current.start_time).slice(0, 5);
  const newDate = (update.date as string | undefined) ?? current.date;
  const newTime = (update.start_time as string | undefined) ?? currentTime;
  if (newDate !== current.date || newTime !== currentTime) {
    const availability = await checkSlotAvailable(newDate, newTime);
    if (!availability.ok) return apiError(422, "SLOT_NOT_AVAILABLE", availability.message);
  }

  update.updated_at = new Date().toISOString();

  const { data, error } = await admin
    .from("appointments")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") return apiError(409, "SLOT_TAKEN", "El horario ya está ocupado");
    return apiError(500, "INTERNAL_ERROR", "No se pudo modificar el turno");
  }

  return NextResponse.json({ appointment: toApiAppointment(data) });
}