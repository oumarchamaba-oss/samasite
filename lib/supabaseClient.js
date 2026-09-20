import { createClient } from "@supabase/supabase-js";

// Ces deux valeurs viennent de votre projet Supabase (voir README_DEPLOIEMENT.md).
// Elles sont publiques côté navigateur — la vraie sécurité vient des règles RLS
// définies dans supabase/schema.sql, pas du secret de ces clés.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Schéma Postgres à utiliser côté client. Par défaut "public" (le projet
// Supabase Cloud actuel, en production, stocke tout dans "public" — voir
// supabase/schema.sql). Sur l'instance self-hosted partagée du VPS Wanekoo,
// les tables de Sama Site vivent dans un schéma dédié "sama_site" (voir
// supabase/schema_sama_site_selfhosted.sql), pour ne jamais se mélanger aux
// autres apps qui tournent sur ce même serveur. Ne définissez
// NEXT_PUBLIC_SUPABASE_SCHEMA=sama_site QUE dans un environnement qui pointe
// réellement vers cette instance self-hosted — jamais sur Vercel/production
// tant que la bascule n'a pas été validée.
const supabaseSchema = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || "public";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: supabaseSchema },
});
