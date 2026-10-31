import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type Role = "secretaria" | "facturista";

export type AuthResult =
  | { ok: true; userId: string; role: Role }
  | { ok: false; response: NextResponse };

export function apiError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function requireRole(allowed: Role[]): Promise<AuthResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, response: apiError(401, "UNAUTHENTICATED", "Sesión requerida") };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!profile || !allowed.includes(profile.role as Role)) {
    return { ok: false, response: apiError(403, "FORBIDDEN", "No tenés permiso para esta acción") };
  }

  return { ok: true, userId: user.id, role: profile.role as Role };
}