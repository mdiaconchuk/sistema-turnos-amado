import { NextResponse } from "next/server";
import { apiError, requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidDate } from "@/lib/validation";

export async function GET(request: Request) {
  const auth = await requireRole(["facturista", "secretaria"]);
  if (!auth.ok) return auth.response;

  const params = new URL(request.url).searchParams;
  const single = params.get("date");
  const from = single ?? params.get("from");
  const to = single ?? params.get("to") ?? from;
  if (!isValidDate(from) || !isValidDate(to)) {
    return apiError(400, "VALIDATION_ERROR", "Indicá date o from/to con formato YYYY-MM-DD");
  }
  if (to < from) {
    return apiError(400, "VALIDATION_ERROR", "to no puede ser anterior a from");
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("appointments")
    .select("date, start_time, patient_name, dni, obra_social")
    .eq("status", "atendido")
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });
  if (error) return apiError(500, "INTERNAL_ERROR", "No se pudo generar el reporte");

  return NextResponse.json({
    items: (data ?? []).map((r) => ({
      date: r.date,
      startTime: String(r.start_time).slice(0, 5),
      patientName: r.patient_name,
      dni: r.dni,
      obraSocial: r.obra_social,
    })),
  });
}