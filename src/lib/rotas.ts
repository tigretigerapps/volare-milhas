import type { Tables, TablesInsert } from '@/integrations/supabase/types'
import { formatarMilhas, formatarReais } from './formato'
import { interpretarDecimalBR, interpretarInteiroBR } from './numero-br'

export type Rota = Tables<'rotas_salvas'>

/** Campos que o usuário controla; user_id vem de auth.uid() no banco. */
export type DadosRota = Pick<
  TablesInsert<'rotas_salvas'>,
  'origem' | 'destino' | 'data_inicio' | 'data_fim' | 'preco_alvo_milhas' | 'preco_alvo_rs' | 'companhias'
>

/** Valores do formulário, como texto, do jeito que o usuário digitou. */
export type FormularioRota = {
  origem: string
  destino: string
  dataInicio: string
  dataFim: string
  alvoMilhas: string
  alvoReais: string
  companhias: string[]
}

export type CampoRota = keyof FormularioRota | 'alvo'

export type ResultadoValidacao =
  | { ok: true; dados: DadosRota }
  | { ok: false; erros: Partial<Record<CampoRota, string>> }

/** Companhias que o monitoramento entende. O valor é o mesmo gravado em ofertas.companhia. */
export const companhiasDisponiveis = [
  { valor: 'GOL', rotulo: 'Smiles (Gol)' },
  { valor: 'AZUL', rotulo: 'Azul Fidelidade' },
  { valor: 'LATAM', rotulo: 'LATAM Pass' },
  { valor: 'TAP', rotulo: 'TAP Miles&Go' },
] as const

export const formularioVazio: FormularioRota = {
  origem: '',
  destino: '',
  dataInicio: '',
  dataFim: '',
  alvoMilhas: '',
  alvoReais: '',
  companhias: [],
}

const codigoAeroporto = /^[A-Z]{3}$/

/**
 * Valida o formulário com as mesmas regras das restrições de public.rotas_salvas,
 * mais uma de produto: não faz sentido monitorar um período que já acabou.
 * `hoje` no formato "AAAA-MM-DD".
 */
export function validarRota(form: FormularioRota, hoje: string): ResultadoValidacao {
  const erros: Partial<Record<CampoRota, string>> = {}
  const origem = form.origem.trim().toUpperCase()
  const destino = form.destino.trim().toUpperCase()

  if (!codigoAeroporto.test(origem)) erros.origem = 'Use o código de 3 letras do aeroporto, como GRU.'
  if (!codigoAeroporto.test(destino)) erros.destino = 'Use o código de 3 letras do aeroporto, como LIS.'
  if (!erros.origem && !erros.destino && origem === destino) erros.destino = 'O destino precisa ser diferente da origem.'

  if (!form.dataInicio) erros.dataInicio = 'Escolha a primeira data do período.'
  if (!form.dataFim) erros.dataFim = 'Escolha a última data do período.'
  if (form.dataInicio && form.dataFim) {
    if (form.dataFim < form.dataInicio) erros.dataFim = 'A data final precisa ser igual ou depois da inicial.'
    else if (form.dataFim < hoje) erros.dataFim = 'Esse período já terminou.'
  }

  const temMilhas = form.alvoMilhas.trim() !== ''
  const temReais = form.alvoReais.trim() !== ''
  const alvoMilhas = temMilhas ? interpretarInteiroBR(form.alvoMilhas) : null
  const alvoReais = temReais ? interpretarDecimalBR(form.alvoReais) : null

  if (temMilhas && alvoMilhas === null) erros.alvoMilhas = 'Use um número inteiro de milhas, como 40.000.'
  if (temReais && alvoReais === null) erros.alvoReais = 'Use um valor em reais, como 2.500,00.'
  if (!temMilhas && !temReais) erros.alvo = 'Defina um preço-alvo em milhas, em reais ou nos dois.'

  if (Object.keys(erros).length > 0) return { ok: false, erros }

  return {
    ok: true,
    dados: {
      origem,
      destino,
      data_inicio: form.dataInicio,
      data_fim: form.dataFim,
      preco_alvo_milhas: alvoMilhas,
      preco_alvo_rs: alvoReais,
      companhias: [...form.companhias].sort(),
    },
  }
}

export function rotaParaFormulario(rota: Rota): FormularioRota {
  return {
    origem: rota.origem,
    destino: rota.destino,
    dataInicio: rota.data_inicio,
    dataFim: rota.data_fim,
    alvoMilhas: rota.preco_alvo_milhas ? formatarMilhas(rota.preco_alvo_milhas) : '',
    alvoReais: rota.preco_alvo_rs ? rota.preco_alvo_rs.toFixed(2).replace('.', ',') : '',
    companhias: rota.companhias,
  }
}

const dataCurta = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

/** "2026-12-01" → "1 dez 2026". Datas do banco não têm fuso, então são lidas em UTC. */
export function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split('-').map(Number)
  return dataCurta
    .format(new Date(Date.UTC(ano, mes - 1, dia)))
    .replace(/\./g, '')
    .replace(/ de /g, ' ')
}

/** "1 dez 2026 a 31 jan 2027", ou só uma data quando início e fim coincidem. */
export function formatarPeriodo(inicio: string, fim: string): string {
  return inicio === fim ? formatarData(inicio) : `${formatarData(inicio)} a ${formatarData(fim)}`
}

/** "até 40.000 milhas ou R$ 2.500". */
export function descreverAlvo(rota: Pick<Rota, 'preco_alvo_milhas' | 'preco_alvo_rs'>): string {
  const partes: string[] = []
  if (rota.preco_alvo_milhas) partes.push(`${formatarMilhas(rota.preco_alvo_milhas)} milhas`)
  if (rota.preco_alvo_rs) partes.push(formatarReais(rota.preco_alvo_rs))
  return `até ${partes.join(' ou ')}`
}

/** [] → "todas as companhias"; ["AZUL", "GOL"] → "Azul Fidelidade e Smiles (Gol)". */
export function descreverCompanhias(companhias: readonly string[]): string {
  if (companhias.length === 0) return 'todas as companhias'
  const nomes = companhias.map((c) => companhiasDisponiveis.find((d) => d.valor === c)?.rotulo ?? c)
  return new Intl.ListFormat('pt-BR', { type: 'conjunction' }).format(nomes)
}

/**
 * Mensagem para o erro do banco ao salvar uma rota. O gatilho de limite do plano devolve "limite_rotas";
 * qualquer outro erro vira a mensagem padrão da ação.
 */
export function mensagemErroRota(erro: { message?: string } | null, padrao: string): string {
  if (erro?.message?.includes('limite_rotas')) {
    return 'Você atingiu o limite de rotas ativas do seu plano. Pause ou exclua uma rota para liberar vaga.'
  }
  return padrao
}
