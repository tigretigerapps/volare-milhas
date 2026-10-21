// Regras do motor de alertas, sem rede nem banco: quais datas verificar, que oferta bateu a meta
// e se vale avisar de novo. A orquestração (buscas e gravação) fica em index.ts.
import { diasEntre } from './datas.ts'

export type RotaAlerta = {
  id: string
  user_id: string
  origem: string
  destino: string
  data_inicio: string
  data_fim: string
  preco_alvo_milhas: number | null
  preco_alvo_rs: number | null
  companhias: string[]
}

/** Linha de public.ofertas, só com o que o motor usa. */
export type OfertaMotor = {
  origem: string
  destino: string
  data_voo: string
  sentido: string
  companhia: string
  programa: string | null
  tipo_milhas: string | null
  numero_voo: string | null
  conexoes: number
  partida: string | null
  chegada: string | null
  milhas: number | null
  taxas_rs: number | null
  valor_dinheiro_rs: number | null
}

export type Criterio = 'milhas' | 'reais'
export type Acerto = { oferta: OfertaMotor; criterio: Criterio; razao: number }

/** A API cobra por consulta: no máximo este número de datas verificadas por rota e companhia. */
export const MAX_DATAS_POR_ROTA = 3

/** Janela mínima entre dois alertas da mesma rota, a menos que o preço melhore. */
export const HORAS_ENTRE_ALERTAS = 24

const somarDias = (iso: string, dias: number) =>
  new Date(Date.parse(`${iso}T00:00:00Z`) + dias * 86_400_000).toISOString().slice(0, 10)

/**
 * Datas a verificar dentro da janela da rota, ignorando as que já passaram:
 * a primeira, a do meio e a última (menos se a janela for curta). Sem datas futuras, lista vazia.
 */
export function datasAmostra(inicio: string, fim: string, hoje: string, max = MAX_DATAS_POR_ROTA): string[] {
  const de = inicio < hoje ? hoje : inicio
  if (fim < de) return []
  const total = diasEntre(de, fim)
  const candidatas = max >= 3 ? [0, Math.floor(total / 2), total] : max === 2 ? [0, total] : [0]
  return [...new Set(candidatas.map((d) => somarDias(de, d)))]
}

/**
 * A melhor oferta de ida que bateu a meta da rota (milhas até o alvo em milhas, ou dinheiro até o alvo em reais).
 * "Melhor" = a que mais folga tem em relação à meta (razão preço/meta mais baixa). Sem meta nem acerto: null.
 */
export function melhorAcerto(rota: RotaAlerta, ofertas: readonly OfertaMotor[]): Acerto | null {
  let melhor: Acerto | null = null
  for (const oferta of ofertas) {
    if (oferta.sentido !== 'ida') continue
    if (!rota.companhias.includes(oferta.companhia)) continue
    if (oferta.data_voo < rota.data_inicio || oferta.data_voo > rota.data_fim) continue

    const candidatos: Acerto[] = []
    if (rota.preco_alvo_milhas && oferta.milhas !== null && oferta.milhas > 0 && oferta.milhas <= rota.preco_alvo_milhas) {
      candidatos.push({ oferta, criterio: 'milhas', razao: oferta.milhas / rota.preco_alvo_milhas })
    }
    if (rota.preco_alvo_rs && oferta.valor_dinheiro_rs !== null && oferta.valor_dinheiro_rs > 0 && oferta.valor_dinheiro_rs <= rota.preco_alvo_rs) {
      candidatos.push({ oferta, criterio: 'reais', razao: oferta.valor_dinheiro_rs / rota.preco_alvo_rs })
    }
    for (const c of candidatos) if (!melhor || c.razao < melhor.razao) melhor = c
  }
  return melhor
}

/** Identifica a oferta do alerta: o mesmo voo, na mesma data e ao mesmo preço, é o mesmo alerta. */
export function chaveDaOferta(rotaId: string, acerto: Acerto): string {
  const o = acerto.oferta
  const preco = acerto.criterio === 'milhas' ? `${o.milhas}mi` : `${o.valor_dinheiro_rs}rs`
  return [rotaId, o.companhia, o.numero_voo ?? 'sem-voo', o.data_voo, preco].join(':')
}

/** O último alerta da rota, como foi gravado (alertas_enviados). */
export type UltimoAlerta = { enviado_em: string; oferta: { milhas?: unknown; valor_dinheiro_rs?: unknown } }

/**
 * Evita repetir aviso: dentro de 24 horas do último alerta da rota só avisa de novo se o preço
 * (no mesmo critério) ficou menor. Passadas as 24 horas, avisa se a oferta ainda bate a meta.
 */
export function deveAlertar(ultimo: UltimoAlerta | null, acerto: Acerto, agora: Date): boolean {
  if (!ultimo) return true
  const horas = (agora.getTime() - Date.parse(ultimo.enviado_em)) / 3_600_000
  if (horas >= HORAS_ENTRE_ALERTAS) return true
  const anterior = acerto.criterio === 'milhas' ? ultimo.oferta.milhas : ultimo.oferta.valor_dinheiro_rs
  const atual = acerto.criterio === 'milhas' ? acerto.oferta.milhas : acerto.oferta.valor_dinheiro_rs
  return typeof anterior === 'number' && typeof atual === 'number' && atual < anterior
}

/** O que é gravado em alertas_enviados.oferta: os campos que o site lê para montar a faixa de alerta. */
export function ofertaDoAlerta(acerto: Acerto): Record<string, unknown> {
  const o = acerto.oferta
  return {
    origem: o.origem,
    destino: o.destino,
    data_voo: o.data_voo,
    companhia: o.companhia,
    programa: o.programa,
    tipo_milhas: o.tipo_milhas,
    numero_voo: o.numero_voo,
    conexoes: o.conexoes,
    partida: o.partida,
    chegada: o.chegada,
    milhas: o.milhas,
    taxas_rs: o.taxas_rs,
    valor_dinheiro_rs: o.valor_dinheiro_rs,
    criterio: acerto.criterio,
  }
}
