import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError } from "@/lib/auth";

// Supabase Auth exige un email: el usuario del consultorio se convierte a uno interno.
const INTERNAL_EMAIL_DOMAIN = "test.com";

export async function POST(request: Request) {
  let body: { username?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return apiError(400, "VALIDATION_ERROR", "Cuerpo JSON inválido");
  }

  const username =
    typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!username || !password || !/^[a-z0-9._-]+$/.test(username)) {
    return apiError(400, "VALIDATION_ERROR", "Usuario y contraseña son obligatorios");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: `${username}@${INTERNAL_EMAIL_DOMAIN}`,
    password,
  });
  if (error || !data.user) {
    return apiError(401, "INVALID_CREDENTIALS", "Usuario o contraseña incorrectos");
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
    user: { id: data.user.id, username, role: profile.role },
  });
}