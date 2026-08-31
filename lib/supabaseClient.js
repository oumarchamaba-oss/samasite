import { createClient } from "@supabase/supabase-js";

// Ces deux valeurs viennent de votre projet Supabase (voir README_DEPLOIEMENT.md).
// Elles sont publiques côté navigateur — la vraie sécurité vient des règles RLS
// définies dans supabase/schema.sql, pas du secret de ces clés.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
