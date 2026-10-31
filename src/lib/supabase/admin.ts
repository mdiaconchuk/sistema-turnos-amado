import { createClient } from "@supabase/supabase-js";

// SOLO importar desde código de servidor (Route Handlers). Nunca desde componentes de cliente.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}