import { createClient } from "@supabase/supabase-js";

/**
 * Client « service_role » : contourne la sécurité RLS. Uniquement côté serveur, et seulement
 * APRÈS avoir vérifié l'identité et le rôle de l'appelant (voir lib/contexte.ts).
 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
