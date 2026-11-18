// Cliente mínimo do Asaas: cliente, assinatura e cobranças da assinatura.
// A chave de API só existe no servidor (segredo ASAAS_API_KEY da Edge Function).

export type Ambiente = 'sandbox' | 'producao'

export const URL_ASAAS: Record<Ambiente, string> = {
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

/** Quantas cobranças da assinatura estão em aberto e quais já foram pagas (com a data de vencimento de cada). */
export async function situacaoDasCobrancas(
  c: ClienteAsaas,
  assinaturaId: string,
): Promise<{ emAberto: number; pagas: { dueDate: string }[] }> {
  const buscar = async (status: string) => {
    const r = await chamar(c, 'GET', `/subscriptions/${encodeURIComponent(assinaturaId)}/payments?status=${status}`)
    return (Array.isArray(r.data) ? r.data : []) as { dueDate: string }[]
  }
  const [pendentes, vencidas, recebidas, confirmadas] = await Promise.all(
    ['PENDING', 'OVERDUE', 'RECEIVED', 'CONFIRMED'].map(buscar),
  )
  return { emAberto: pendentes.length + vencidas.length, pagas: [...recebidas, ...confirmadas] }
}

export type DadosCheckoutTeste = {
  clienteId: string
  /** Usado só se o Asaas não aceitar o cliente já criado no checkout. */
  cliente: { nome: string; cpfCnpj: string; email: string | null }
  valor: number
  nomePlano: string
  primeiraCobranca: string
  userId: string
  urls: { sucesso: string; cancelado: string; expirado: string }
  imagemBase64: string
}

/**
 * Checkout do Asaas para o teste grátis: a pessoa cadastra o cartão na página do Asaas (o cartão não passa por
 * aqui) e a assinatura mensal nasce com a primeira cobrança em `primeiraCobranca`. Devolve o link do checkout.
 */
export async function criarCheckoutTeste(c: ClienteAsaas, d: DadosCheckoutTeste): Promise<{ id: string; link: string }> {
  const base = {
    billingTypes: ['CREDIT_CARD'],
    chargeTypes: ['RECURRENT'],
    minutesToExpire: 60,
    externalReference: d.userId,
    callback: { successUrl: d.urls.sucesso, cancelUrl: d.urls.cancelado, expiredUrl: d.urls.expirado },
    items: [
      {
        name: `Volo Milhas ${d.nomePlano}`.slice(0, 30),
        description: `Assinatura mensal. Teste grátis até ${d.primeiraCobranca.split('-').reverse().join('/')}.`,
        quantity: 1,
        value: d.valor,
        imageBase64: d.imagemBase64,
      },
    ],
    subscription: { cycle: 'MONTHLY', nextDueDate: d.primeiraCobranca },
  }
  let r: Corpo
  try {
    r = await chamar(c, 'POST', '/checkouts', { ...base, customer: d.clienteId })
  } catch (e) {
    // A documentação do Asaas não é clara sobre aceitar um cliente já criado: se recusar, manda os dados dele.
    if (!(e instanceof ErroAsaas) || e.status !== 400) throw e
    console.log(JSON.stringify({ checkout: 'sem_customer', motivo: e.descricao }))
    r = await chamar(c, 'POST', '/checkouts', {
      ...base,
      customerData: {
        name: d.cliente.nome,
        cpfCnpj: d.cliente.cpfCnpj,
        ...(d.cliente.email ? { email: d.cliente.email } : {}),
      },
    })
  }
  const link = typeof r.link === 'string' ? r.link : null
  if (typeof r.id !== 'string' || !link) throw new ErroAsaas('Asaas não devolveu o link do checkout', 502, null)
  return { id: r.id, link }
}

/** Assinaturas do cliente no Asaas (inclusive as removidas, para saber se já houve alguma). */
export async function assinaturasDoCliente(c: ClienteAsaas, clienteId: string): Promise<Corpo[]> {
  const r = await chamar(c, 'GET', `/subscriptions?customer=${encodeURIComponent(clienteId)}&includeDeleted=true&limit=50`)
  return Array.isArray(r.data) ? r.data : []
}

/** Assinaturas marcadas com o nosso id de usuário (o checkout leva o externalReference). */
export async function assinaturasPorReferencia(c: ClienteAsaas, userId: string): Promise<Corpo[]> {
  const r = await chamar(c, 'GET', `/subscriptions?externalReference=${encodeURIComponent(userId)}&limit=50`)
  return Array.isArray(r.data) ? r.data : []
}

/** Clientes do Asaas com este CPF ou CNPJ (só dígitos). */
export async function clientesPorDocumento(c: ClienteAsaas, cpfCnpj: string): Promise<string[]> {
  const r = await chamar(c, 'GET', `/customers?cpfCnpj=${encodeURIComponent(cpfCnpj)}&limit=20`)
  return (Array.isArray(r.data) ? r.data : []).map((x: Corpo) => x.id).filter((id: unknown): id is string => typeof id === 'string')
}
