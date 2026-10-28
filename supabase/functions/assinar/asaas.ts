// Cliente mínimo do Asaas: cliente, assinatura e cobranças da assinatura.
// A chave de API só existe no servidor (segredo ASAAS_API_KEY da Edge Function).

export type Ambiente = 'sandbox' | 'producao'

export const URL_ASAAS: Record<Ambiente, string> = {
  sandbox: 'https://api-sandbox.asaas.com/v3',
  producao: 'https://api.asaas.com/v3',
}

export type Requisicao = typeof fetch

export class ErroAsaas extends Error {
  readonly status: number
  /** Mensagem do Asaas, em português, quando vier no corpo (ex.: "CPF/CNPJ inválido"). */
  readonly descricao: string | null

  constructor(mensagem: string, status: number, descricao: string | null) {
    super(mensagem)
    this.status = status
    this.descricao = descricao
  }
}

export type ClienteAsaas = { ambiente: Ambiente; chave: string; req?: Requisicao }

// deno-lint-ignore no-explicit-any
type Corpo = Record<string, any>

async function chamar(c: ClienteAsaas, metodo: 'GET' | 'POST' | 'DELETE', caminho: string, corpo?: Corpo): Promise<Corpo> {
  const resposta = await (c.req ?? fetch)(`${URL_ASAAS[c.ambiente]}${caminho}`, {
    method: metodo,
    headers: {
      access_token: c.chave,
      Accept: 'application/json',
      'User-Agent': 'volare-milhas',
      ...(corpo ? { 'Content-Type': 'application/json' } : {}),
    },
    // O Asaas devolve 403 em GET com corpo, então só POST leva corpo.
    ...(corpo ? { body: JSON.stringify(corpo) } : {}),
    signal: AbortSignal.timeout(20_000),
  })
  let json: Corpo = {}
  try {
    json = (await resposta.json()) as Corpo
  } catch {
    // corpo vazio ou ilegível
  }
  if (!resposta.ok) {
    const descricao = Array.isArray(json.errors) && typeof json.errors[0]?.description === 'string' ? json.errors[0].description : null
    throw new ErroAsaas(`Asaas respondeu HTTP ${resposta.status} em ${caminho}`, resposta.status, descricao)
  }
  return json
}

export async function criarCliente(
  c: ClienteAsaas,
  dados: { nome: string; cpfCnpj: string; email: string | null; celular: string | null; userId: string },
): Promise<string> {
  const r = await chamar(c, 'POST', '/customers', {
    name: dados.nome,
    cpfCnpj: dados.cpfCnpj,
    ...(dados.email ? { email: dados.email } : {}),
    ...(dados.celular ? { mobilePhone: dados.celular } : {}),
    externalReference: dados.userId,
  })
  if (typeof r.id !== 'string') throw new ErroAsaas('Asaas não devolveu o id do cliente', 502, null)
  return r.id
}

export async function criarAssinatura(
  c: ClienteAsaas,
  dados: { clienteId: string; valor: number; vencimento: string; descricao: string; userId: string },
): Promise<string> {
  const r = await chamar(c, 'POST', '/subscriptions', {
    customer: dados.clienteId,
    // UNDEFINED: quem paga escolhe PIX, cartão ou boleto na página da fatura, hospedada pelo Asaas.
    billingType: 'UNDEFINED',
    value: dados.valor,
    nextDueDate: dados.vencimento,
    cycle: 'MONTHLY',
    description: dados.descricao,
    externalReference: dados.userId,
  })
  if (typeof r.id !== 'string') throw new ErroAsaas('Asaas não devolveu o id da assinatura', 502, null)
  return r.id
}

/** Cancela a assinatura no Asaas (para de gerar cobranças). Assinatura que já não existe conta como cancelada. */
export async function cancelarAssinatura(c: ClienteAsaas, assinaturaId: string): Promise<void> {
  try {
    await chamar(c, 'DELETE', `/subscriptions/${encodeURIComponent(assinaturaId)}`)
  } catch (e) {
    if (e instanceof ErroAsaas && e.status === 404) return
    throw e
  }
}

/** O link da fatura em aberto mais antiga da assinatura (pendente ou vencida), ou null se não houver. */
export async function faturaEmAberto(c: ClienteAsaas, assinaturaId: string): Promise<string | null> {
  const cobrancas: { status: string; dueDate: string; invoiceUrl?: string }[] = []
  for (const status of ['PENDING', 'OVERDUE']) {
    const r = await chamar(c, 'GET', `/subscriptions/${encodeURIComponent(assinaturaId)}/payments?status=${status}`)
    cobrancas.push(...(Array.isArray(r.data) ? r.data : []))
  }
  const maisAntiga = cobrancas
    .filter((p) => typeof p.invoiceUrl === 'string')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]
  return maisAntiga?.invoiceUrl ?? null
}
