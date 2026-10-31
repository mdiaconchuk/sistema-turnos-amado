import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError } from "@/lib/auth";

export async function POST(request: Request) {
  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return apiError(400, "VALIDATION_ERROR", "Cuerpo JSON inválido");
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) {
    return apiError(400, "VALIDATION_ERROR", "Email y contraseña son obligatorios");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return apiError(401, "INVALID_CREDENTIALS", "Email o contraseña incorrectos");
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("user_id", data.user.id)
    .single();

  if (!profile) {
    await supabase.auth.signOut();
    return apiError(403, "NO_ROLE", "El usuario no tiene un rol asignado");
  }

  return NextResponse.json({
    user: { id: data.user.id, email: data.user.email, role: profile.role },
  });
}