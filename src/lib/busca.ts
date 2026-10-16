import type { Oferta } from '@/data/exemplo'
import type { Json, Tables } from '@/integrations/supabase/types'

export type OfertaBanco = Tables<'ofertas'>

/** Companhias consultadas por padrão: a API cobra por companhia, então o conjunto é fixo e pequeno. */
export const companhiasPadrao = ['GOL', 'AZUL', 'LATAM', 'TAP']

export type PedidoBuscaApp = {
  origem: string
  destino: string
  /** "AAAA-MM-DD" */
  dataIda: string
  /** "AAAA-MM-DD" ou null para só ida. */
  dataVolta: string | null
  companhias: string[]
}

export type Uso = { destinos_usados: number; destinos_limite: number | null }

export type ErroBusca = { codigo: string; mensagem: string; uso?: Uso }

const rotulosSmiles: Record<string, string> = {
  smiles: 'Smiles',
  'clube smiles': 'Smiles (clube)',
  diamante: 'Smiles (diamante)',
}

/**
 * Nome do programa como aparece na linha. A tarifa entra entre parênteses quando diferencia ofertas do
 * mesmo voo (Smiles e Smiles clube; LATAM Light e Plus). Tarifa que só repete o nome não acrescenta nada.
 */
export function rotuloPrograma(programa: string | null, tipoMilhas: string | null, companhia: string): string {
  const base = programa ?? companhia
  const tipo = (tipoMilhas ?? '').trim().toLowerCase()
  if (!tipo) return base
  if (base === 'Smiles') return rotulosSmiles[tipo] ?? `Smiles (${tipo})`
  if (tipo === companhia.toLowerCase() || tipo === base.toLowerCase()) return base
  return `${base} (${tipo})`
}

/** Aeroportos das paradas, na ordem. Sem o detalhe das conexões, só conta as paradas (códigos vazios). */
export function paradasDe(conexoes: number, detalhe: Json): string[] {
  const segmentos = Array.isArray(detalhe) ? detalhe : []
  if (conexoes > 0 && segmentos.length === conexoes + 1) {
    return segmentos.slice(0, -1).map((s) => {
      const destino = typeof s === 'object' && s !== null && !Array.isArray(s) ? s.Destino : null
      return typeof destino === 'string' ? destino : ''
    })
  }
  return Array<string>(conexoes).fill('')
}

/** "01:15:00" → 75; "1 day 02:00:00" → 1560. Aceita o formato de interval do Postgres. */
export function duracaoParaMinutos(intervalo: string | null): number | null {
  if (!intervalo) return null
  const m = intervalo.trim().match(/^(?:(\d+) days?\s+)?(\d+):(\d{2})(?::\d{2})?$/)
  if (!m) return null
  return Number(m[1] ?? 0) * 1440 + Number(m[2]) * 60 + Number(m[3])
}

/** "2026-12-15T07:10:00" → "07:10". */
export function horaDe(timestamp: string): string {
  return timestamp.slice(11, 16)
}

/**
 * Transforma uma linha de public.ofertas na linha da tela. Devolve null se faltar milhas ou o preço em
 * dinheiro: sem os dois não há comparação a mostrar.
 */
export function ofertaDoBanco(linha: OfertaBanco): Oferta | null {
  if (linha.milhas === null || linha.valor_dinheiro_rs === null || !linha.partida || !linha.chegada) return null
  const duracao =
    duracaoParaMinutos(linha.duracao) ??
    Math.max(0, Math.round((Date.parse(linha.chegada) - Date.parse(linha.partida)) / 60000))

  return {
    id: linha.id,
    programa: rotuloPrograma(linha.programa, linha.tipo_milhas, linha.companhia),
    voo: linha.numero_voo ?? '',
    origem: linha.aeroporto_origem ?? linha.origem,
    destino: linha.aeroporto_destino ?? linha.destino,
    partida: horaDe(linha.partida),
    chegada: horaDe(linha.chegada),
    paradas: paradasDe(linha.conexoes, linha.conexoes_detalhe),
    duracaoMinutos: duracao,
    dinheiro: linha.valor_dinheiro_rs,
    milhas: linha.milhas,
    taxas: linha.taxas_rs ?? 0,
    sentido: linha.sentido === 'volta' ? 'volta' : 'ida',
    dataVoo: linha.data_voo,
  }
}

export function separarPorSentido(ofertas: readonly Oferta[]): { ida: Oferta[]; volta: Oferta[] } {
  return {
    ida: ofertas.filter((o) => o.sentido !== 'volta'),
    volta: ofertas.filter((o) => o.sentido === 'volta'),
  }
}

/**
 * Converte o erro de supabase.functions.invoke na mensagem em português que a função devolveu
 * (limite do plano, assinatura inativa...). Sem corpo legível, cai numa mensagem genérica.
 */
export async function lerErroFuncao(erro: unknown): Promise<ErroBusca> {
  const generico: ErroBusca = {
    codigo: 'erro',
    mensagem: 'Não foi possível buscar agora. Tente de novo em instantes.',
  }
  if (typeof erro !== 'object' || erro === null) return generico
  const e = erro as { name?: string; context?: unknown }

  if (e.name === 'FunctionsFetchError') {
    return { codigo: 'sem_conexao', mensagem: 'Sem conexão com o servidor. Verifique sua internet e tente de novo.' }
  }
  if (e.name === 'FunctionsHttpError' && e.context instanceof Response) {
    try {
      const corpo = await e.context.json()
      if (typeof corpo?.mensagem === 'string') {
        return { codigo: String(corpo.codigo ?? 'erro'), mensagem: corpo.mensagem, uso: corpo.uso }
      }
    } catch {
      // corpo ilegível: cai no genérico
    }
  }
  return generico
}
