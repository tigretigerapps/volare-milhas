// Monta o pedido de orçamento (POST /solicitacao do CRM Iddas) a partir de uma oferta escolhida.
// Funções puras, sem rede nem banco: dá para testar e para mostrar o que será enviado antes de enviar.

/** Linha de public.ofertas, só com o que o pedido usa. */
export type OfertaLinha = {
  origem: string
  destino: string
  data_voo: string
  sentido: string
  companhia: string
  programa: string | null
  tipo_milhas: string | null
  numero_voo: string | null
  cabine: string | null
  conexoes: number
  partida: string | null
  chegada: string | null
  milhas: number | null
  taxas_rs: number | null
  valor_dinheiro_rs: number | null
}

export type DadosLead = {
  nome: string
  email: string | null
  /** Como está no perfil, em qualquer formato: "(11) 91234-5678". */
  telefone: string
  oferta: OfertaLinha
  /** Datas da busca (a oferta sozinha só sabe a data do seu próprio voo). */
  dataIdaBusca: string
  dataVoltaBusca: string | null
  /** Nomes das cidades da busca, na direção da busca (origem, destino). Vazio: usa só o código. */
  cidadeOrigem: string | null
  cidadeDestino: string | null
  milheiroCliente: number | null
  referencia: string
  /** "mock" = preços do banco fake, não reais. */
  fonteDados: 'mock' | 'real'
}

export type SolicitacaoIddas = {
  nome: string
  email?: string
  telefone: string
  origem: string
  destino: string
  data_ida: string
  data_volta?: string
  passageiro_adulto: string
  /** O CRM exige S ou N. */
  flexibilidade: 'S' | 'N'
  observacao: string
  canal_venda?: string
}

/**
 * Telefone no formato do CRM ("+11999887766"). Aceita DDD + número (10 ou 11 dígitos, assume Brasil)
 * ou número já com 55. Devolve null se não der para montar um telefone plausível.
 */
export function normalizarTelefone(bruto: string): string | null {
  const digitos = bruto.replace(/\D/g, '')
  if (/^55\d{10,11}$/.test(digitos)) return `+${digitos}`
  if (/^\d{10,11}$/.test(digitos)) return `+55${digitos}`
  return null
}

/** Nome de cidade vindo do navegador: sem caracteres de controle, tamanho limitado. */
export function limparNomeCidade(valor: unknown): string | null {
  if (typeof valor !== 'string') return null
  // oxlint-disable-next-line no-control-regex -- a intenção é justamente remover caracteres de controle
  const limpo = valor.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60)
  return limpo || null
}

export function nomeDoCliente(nomePerfil: string | null, email: string | null): string {
  const nome = nomePerfil?.trim()
  if (nome) return nome
  return email?.split('@')[0] || 'Cliente Volare Milhas'
}

const reais = (valor: number) => `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const numero = (valor: number) => valor.toLocaleString('pt-BR')
const horaDe = (timestamp: string | null) => (timestamp && timestamp.length >= 16 ? timestamp.slice(11, 16) : null)
const dataBR = (iso: string) => iso.split('-').reverse().join('/')

function paradas(conexoes: number): string {
  if (conexoes <= 0) return 'voo direto'
  return conexoes === 1 ? '1 parada' : `${conexoes} paradas`
}

function descreverOferta(o: OfertaLinha): string[] {
  const programa = o.programa ?? o.companhia
  const tarifa = o.tipo_milhas && o.tipo_milhas.toLowerCase() !== programa.toLowerCase() ? ` (${o.tipo_milhas})` : ''
  const horarios = [horaDe(o.partida) && `saída ${horaDe(o.partida)}`, horaDe(o.chegada) && `chegada ${horaDe(o.chegada)}`]
    .filter(Boolean)
    .join(', ')
  const linhas = [
    `Oferta escolhida (${o.sentido === 'volta' ? 'volta' : 'ida'}, ${dataBR(o.data_voo)}): ${o.companhia}` +
      `${o.numero_voo ? `, voo ${o.numero_voo}` : ''}, ${paradas(o.conexoes)}${horarios ? `, ${horarios}` : ''}` +
      `${o.cabine ? `, cabine ${o.cabine}` : ''}.`,
  ]
  const valores: string[] = []
  if (o.milhas !== null) valores.push(`Milhas (${programa}${tarifa}): ${numero(o.milhas)} milhas + ${reais(o.taxas_rs ?? 0)} de taxas.`)
  if (o.valor_dinheiro_rs !== null) valores.push(`Em dinheiro: ${reais(o.valor_dinheiro_rs)}.`)
  if (valores.length) linhas.push(valores.join(' '))
  return linhas
}

export function montarSolicitacao(d: DadosLead, canalVenda?: string): SolicitacaoIddas {
  const o = d.oferta
  // A oferta de volta tem origem e destino invertidos em relação à viagem; o pedido segue a viagem de ida.
  const volta = o.sentido === 'volta'
  const codigoOrigem = volta ? o.destino : o.origem
  const codigoDestino = volta ? o.origem : o.destino
  const cidade = (nome: string | null, codigo: string) => (nome ? `${nome} (${codigo})` : codigo)

  const dataIda = volta ? d.dataIdaBusca : o.data_voo
  const dataVolta = volta ? o.data_voo : d.dataVoltaBusca

  const observacao = [
    `Lead da plataforma Volare Milhas. Referência interna: ${d.referencia}.`,
    ...descreverOferta(o),
    d.milheiroCliente !== null ? `Milheiro do cliente: ${reais(d.milheiroCliente)}.` : null,
    d.fonteDados === 'mock' ? 'ATENÇÃO: dados de teste (banco fake), os preços não são reais.' : null,
  ]
    .filter(Boolean)
    .join('\n')

  const solicitacao: SolicitacaoIddas = {
    nome: d.nome,
    telefone: normalizarTelefone(d.telefone) ?? d.telefone,
    origem: cidade(d.cidadeOrigem, codigoOrigem),
    destino: cidade(d.cidadeDestino, codigoDestino),
    data_ida: dataIda,
    passageiro_adulto: '1',
    // A oferta escolhida tem data e voo definidos: sem flexibilidade de datas.
    flexibilidade: 'N',
    observacao,
  }
  if (d.email) solicitacao.email = d.email
  if (dataVolta) solicitacao.data_volta = dataVolta
  if (canalVenda) solicitacao.canal_venda = canalVenda
  return solicitacao
}
