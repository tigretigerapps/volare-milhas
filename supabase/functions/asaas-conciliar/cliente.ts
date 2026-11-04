// Consultas (só GET) à API do Asaas. A chave vem do segredo ASAAS_API_KEY e nunca sai do servidor.

export type Ambiente = 'sandbox' | 'producao'

const URL_ASAAS: Record<Ambiente, string> = {
  sandbox: 'https://api-sandbox.asaas.com/v3',
  producao: 'https://api.asaas.com/v3',
}

// deno-lint-ignore no-explicit-any
export type Corpo = Record<string, any>

/** GET sem corpo (o Asaas responde 403 a GET com corpo). Devolve o status HTTP junto, para o diagnóstico mostrar falhas. */
export async function consultar(
  ambiente: Ambiente,
  chave: string,
  caminho: string,
  req: typeof fetch = fetch,
): Promise<{ status: number; corpo: Corpo }> {
  const resposta = await req(`${URL_ASAAS[ambiente]}${caminho}`, {
    method: 'GET',
    headers: { access_token: chave, Accept: 'application/json', 'User-Agent': 'volare-milhas' },
    signal: AbortSignal.timeout(20_000),
  })
  let corpo: Corpo = {}
  try {
    corpo = (await resposta.json()) as Corpo
  } catch {
    // corpo vazio ou ilegível
  }
  return { status: resposta.status, corpo }
}
