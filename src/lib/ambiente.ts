type Variaveis = { VITE_SUPABASE_URL?: string; VITE_SUPABASE_ANON_KEY?: string }

/** As variáveis do Supabase são gravadas no site na hora do build: sem elas, o app não consegue funcionar. */
export function supabaseConfigurado(env: Variaveis): boolean {
  return Boolean(env.VITE_SUPABASE_URL?.trim() && env.VITE_SUPABASE_ANON_KEY?.trim())
}
