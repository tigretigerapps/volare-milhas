/** Aparece no lugar do app quando o build foi feito sem as variáveis do Supabase. */
export function ConfiguracaoAusente() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 px-4 py-10">
      <h1 className="font-display text-2xl font-medium">Configuração incompleta</h1>
      <p className="text-texto-secundario">
        Este site foi publicado sem as variáveis de ambiente do Supabase, então não consegue carregar. Defina as duas
        variáveis abaixo no ambiente de build e publique de novo:
      </p>
      <ul className="list-disc pl-5 tabular-nums">
        <li>VITE_SUPABASE_URL</li>
        <li>VITE_SUPABASE_ANON_KEY</li>
      </ul>
      <p className="text-sm text-texto-secundario">
        Elas são lidas durante o build. Cadastrá-las depois de publicado não muda um site que já foi construído.
      </p>
    </main>
  )
}
