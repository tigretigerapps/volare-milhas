// Cliente mínimo do CRM Iddas Agência: login por chave e criação de solicitação.
// A chave só existe aqui, no servidor (segredo IDDAS_CHAVE da Edge Function).
import type { SolicitacaoIddas } from './payload.ts'

export const URL_BASE_IDDAS = 'https://apiagencia.iddas.com.br/api/v1'

export type Requisicao = typeof fetch

async function lerJson(resposta: Response): Promise<{ [k: string]: unknown } | null> {
  try {
    return (await resposta.json()) as { [k: string]: unknown } | null
  } catch {
    return null
  }
}

export async function entrar(chave: string, req: Requisicao = fetch): Promise<string> {
  const resposta = await req(`${URL_BASE_IDDAS}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ chave }),
    signal: AbortSignal.timeout(15_000),
  })
  const corpo = await lerJson(resposta)
  if (!resposta.ok || typeof corpo?.access_token !== 'string') {
    throw new Error(`login no CRM falhou (HTTP ${resposta.status})`)
  }
  return corpo.access_token
}

/** Cria a solicitação e devolve o id dela no CRM. */
export async function criarSolicitacao(
  chave: string,
  solicitacao: SolicitacaoIddas,
  req: Requisicao = fetch,
): Promise<number> {
  const token = await entrar(chave, req)
  const resposta = await req(`${URL_BASE_IDDAS}/solicitacao`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(solicitacao),
    signal: AbortSignal.timeout(15_000),
  })
  const corpo = await lerJson(resposta)
  const dados = corpo?.data as { id?: unknown } | undefined
  if (resposta.status !== 201 || typeof dados?.id !== 'number') {
    throw new Error(`CRM recusou a solicitação (HTTP ${resposta.status}): ${JSON.stringify(corpo)?.slice(0, 300)}`)
  }
  return dados.id
}
