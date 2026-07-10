import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

// Cliente com service_role — ignora RLS. Uso restrito a rotas server-side
// de confiança (ex.: pipeline de ingestão em /api/mensagem). Nunca exponha
// SUPABASE_SERVICE_ROLE_KEY ao browser.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
