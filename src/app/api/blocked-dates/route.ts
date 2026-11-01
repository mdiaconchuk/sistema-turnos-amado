import { NextResponse } from "next/server";
import { apiError, requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidDate } from "@/lib/validation";

export async function GET() {
  const auth = await requireRole(["secretaria"]);
  if (!auth.ok) return auth.response;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("blocked_dates")
    .select("date, reason")
    .order("date", { ascending: true });
  if (error) return apiError(500, "INTERNAL_ERROR", "No se pudieron leer las fechas bloqueadas");

  return NextResponse.json({ dates: data ?? [] });
}

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

  if (!isValidDate(body.date)) {
    return apiError(400, "VALIDATION_ERROR", "Fecha inválida (YYYY-MM-DD)");
  }
  const date = body.date;
  const reason = typeof body.reason === "string" ? body.reason.trim() || null : null;

  const admin = createAdminClient();

  // Si hay turnos activos ese día, la secretaria debe resolverlos antes: no se cancela nada solo
  const { data: active, error: activeError } = await admin
    .from("appointments")
    .select("id, date, start_time, patient_name, dni, obra_social, phone, status")
    .eq("date", date)
    .neq("status", "cancelado")
    .order("start_time", { ascending: true });
  if (activeError) return apiError(500, "INTERNAL_ERROR", "No se pudieron revisar los turnos");

  if ((active ?? []).length > 0) {
    return NextResponse.json(
      {
        error: {
          code: "CONFLICTS_PENDING",
          message: "Hay turnos en esa fecha que deben resolverse antes de bloquearla",
          details: {
            appointments: active!.map((a) => ({
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

  const { error } = await admin.from("blocked_dates").insert({ date, reason });
  if (error) {
    if (error.code === "23505") return apiError(409, "ALREADY_BLOCKED", "La fecha ya está bloqueada");
    return apiError(500, "INTERNAL_ERROR", "No se pudo bloquear la fecha");
  }

  return NextResponse.json({ date, reason }, { status: 201 });
}