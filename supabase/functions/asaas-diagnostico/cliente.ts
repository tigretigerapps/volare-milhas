// Consultas (só GET) à API do Asaas. A chave vem do segredo ASAAS_API_KEY e nunca sai do servidor.

export type Ambiente = 'sandbox' | 'producao'

const URL_ASAAS: Record<Ambiente, string> = {
  sandbox: 'https://api-sandbox.asaas.com/v3',
  producao: 'https://api.asaas.com/v3',
}

/**
 * As chaves novas do Asaas dizem o ambiente no prefixo: "$aact_prod_" (produção) e "$aact_hmlg_" (sandbox).
 * Devolve true quando a chave é claramente do outro ambiente (chaves antigas, sem o marcador, passam).
 */
export function chaveDeOutroAmbiente(chave: string, ambiente: Ambiente): boolean {
  if (ambiente === 'producao') return chave.startsWith('$aact_hmlg_')
  return chave.startsWith('$aact_prod_')
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

/**
 * Remove a penalização da fila de um webhook (POST /webhooks/{id}/removeBackoff): o Asaas reenvia na hora os
 * avisos que estavam esperando o próximo intervalo. É a única escrita deste arquivo. Devolve true no HTTP 204.
 */
export async function removerPenalizacao(
  ambiente: Ambiente,
  chave: string,
  webhookId: string,
  req: typeof fetch = fetch,
): Promise<{ ok: boolean; status: number }> {
  const resposta = await req(`${URL_ASAAS[ambiente]}/webhooks/${encodeURIComponent(webhookId)}/removeBackoff`, {
    method: 'POST',
    headers: { access_token: chave, Accept: 'application/json', 'User-Agent': 'volare-milhas' },
    signal: AbortSignal.timeout(20_000),
  })
  return { ok: resposta.status === 204 || resposta.status === 200, status: resposta.status }
}
