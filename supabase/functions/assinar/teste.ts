// Regras do teste grátis. Funções puras, sem rede nem banco.

/** Dias de teste antes da primeira cobrança. */
export const DIAS_TESTE = 7

/** "2026-11-18" + 7 = "2026-11-25". */
export function somarDias(iso: string, dias: number): string {
  const [ano, mes, dia] = iso.split('-').map(Number)
  return new Date(Date.UTC(ano, mes - 1, dia + dias)).toISOString().slice(0, 10)
}

export type LinhaAssinatura = {
  status: string
  asaas_subscription_id: string | null
  data_inicio: string | null
} | null

/**
 * O teste vale uma vez: só para quem nunca teve assinatura. Uma linha sem assinatura no Asaas e sem data de
 * início é um checkout de teste que ficou aberto (a pessoa saiu antes de cadastrar o cartão) e pode recomeçar.
 */
export function podeTestar(linha: LinhaAssinatura): boolean {
  return !linha || (!linha.asaas_subscription_id && !linha.data_inicio)
}

/** Checkout de teste aberto: esperando a pessoa cadastrar o cartão na página do Asaas. */
export function checkoutDeTesteAberto(linha: LinhaAssinatura & { asaas_customer_id?: string | null }): boolean {
  return Boolean(linha && linha.status === 'pendente' && !linha.asaas_subscription_id && !linha.data_inicio && linha.asaas_customer_id)
}

export type AssinaturaAsaas = {
  id?: unknown
  status?: unknown
  billingType?: unknown
  nextDueDate?: unknown
  deleted?: unknown
  dateCreated?: unknown
}

/**
 * Entre as assinaturas do cliente no Asaas, a que nasceu do checkout de teste: ativa, no cartão e com a
 * primeira cobrança no futuro. (A assinatura paga comum é "UNDEFINED" e vence no dia.) A mais nova vence.
 */
export function assinaturaDoTeste(lista: readonly AssinaturaAsaas[], hoje: string): { id: string; proximaCobranca: string } | null {
  const candidatas = lista
    .filter(
      (a) =>
        typeof a.id === 'string' &&
        a.deleted !== true &&
        a.status === 'ACTIVE' &&
        a.billingType === 'CREDIT_CARD' &&
        typeof a.nextDueDate === 'string' &&
        a.nextDueDate.slice(0, 10) > hoje,
    )
    .sort((a, b) => String(b.dateCreated ?? '').localeCompare(String(a.dateCreated ?? '')))
  const escolhida = candidatas[0]
  return escolhida ? { id: escolhida.id as string, proximaCobranca: (escolhida.nextDueDate as string).slice(0, 10) } : null
}

/** Endereço do site para onde o Asaas devolve a pessoa: a origem do pedido, se for de um site; senão o padrão. */
export function enderecoDoSite(origem: string | null, padrao: string): string {
  if (origem && /^https:\/\/[a-z0-9.-]+(:\d+)?$/i.test(origem)) return origem
  if (origem && /^http:\/\/localhost(:\d+)?$/i.test(origem)) return origem
  return padrao.replace(/\/+$/, '')
}
