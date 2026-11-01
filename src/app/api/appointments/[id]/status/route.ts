import { NextResponse } from "next/server";
import { apiError, requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { toApiAppointment } from "@/lib/appointments";
import { parseId, STATUS_TRANSITIONS } from "@/lib/appointment-rules";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["secretaria"]);
  if (!auth.ok) return auth.response;

  const id = parseId((await params).id);
  if (id === null) return apiError(400, "VALIDATION_ERROR", "Id inválido");

  let status: unknown;
  try {
    status = (await request.json())?.status;
  } catch {
    return apiError(400, "VALIDATION_ERROR", "Cuerpo JSON inválido");
  }
  if (status === "cancelado") {
    return apiError(400, "VALIDATION_ERROR", "Para cancelar usá POST /api/appointments/:id/cancel");
  }
  if (status !== "reservado" && status !== "atendido" && status !== "ausente") {
    return apiError(400, "VALIDATION_ERROR", "Estado inválido");
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
  if (!STATUS_TRANSITIONS[current.status]?.includes(status)) {
    return apiError(409, "INVALID_TRANSITION", `No se puede pasar de ${current.status} a ${status}`);
  }

  const { data, error } = await admin
    .from("appointments")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return apiError(500, "INTERNAL_ERROR", "No se pudo cambiar el estado");

  return NextResponse.json({ appointment: toApiAppointment(data) });
}