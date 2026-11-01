import { NextResponse } from "next/server";
import { apiError, requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidDate } from "@/lib/validation";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  const auth = await requireRole(["secretaria"]);
  if (!auth.ok) return auth.response;

  const { date } = await params;
  if (!isValidDate(date)) return apiError(400, "VALIDATION_ERROR", "Fecha inválida (YYYY-MM-DD)");

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("blocked_dates")
    .delete()
    .eq("date", date)
    .select();
  if (error) return apiError(500, "INTERNAL_ERROR", "No se pudo desbloquear la fecha");
  if (!data || data.length === 0) return apiError(404, "NOT_FOUND", "La fecha no estaba bloqueada");

  return NextResponse.json({ ok: true });
}