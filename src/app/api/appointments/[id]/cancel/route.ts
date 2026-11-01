import { NextResponse } from "next/server";
import { apiError, requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { toApiAppointment } from "@/lib/appointments";
import { parseId } from "@/lib/appointment-rules";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["secretaria"]);
  if (!auth.ok) return auth.response;

  const id = parseId((await params).id);
  if (id === null) return apiError(400, "VALIDATION_ERROR", "Id inválido");

  const admin = createAdminClient();
  const { data: current, error: findError } = await admin
    .from("appointments")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (findError) return apiError(500, "INTERNAL_ERROR", "No se pudo leer el turno");
  if (!current) return apiError(404, "NOT_FOUND", "El turno no existe");
  if (current.status === "cancelado") {
    return apiError(409, "INVALID_STATE", "El turno ya está cancelado");
  }

  // El registro se conserva como historial; al salir de los estados activos, el horario queda libre
  const { data, error } = await admin
    .from("appointments")
    .update({ status: "cancelado", updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return apiError(500, "INTERNAL_ERROR", "No se pudo cancelar el turno");

  return NextResponse.json({ appointment: toApiAppointment(data) });
}