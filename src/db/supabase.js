import { createClient } from "@supabase/supabase-js";
import ws from "ws"; // 👈 1. Importe o pacote ws aqui

const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

export const supabase = createClient(
  process.env.SUPABASE_URL,
  key,
  { 
    auth: { persistSession: false },
    realtime: { transport: ws } // 👈 2. Adicione o transport aqui
  }
);