import type { Json } from '@/integrations/supabase/types'
import { formatarMilhas, formatarReais } from './formato'

/** Linha de public.alertas_enviados com a rota (rotas_salvas) embutida. */
export type LinhaAlerta = {
  id: string
  enviado_em: string
  oferta_chave: string
  oferta: Json
  rotas_salvas: {
    origem: string
    destino: string
    preco_alvo_milhas: number | null
    preco_alvo_rs: number | null
  } | null
}

export type AlertaPrecoAlvo = {
  id: string
  enviadoEm: string
  origem: string
  destino: string
  /** Programa ou companhia da oferta que bateu a meta, quando o alerta informa. */
  programa: string | null
  milhas: number | null
  valorReais: number | null
  metaMilhas: number | null
  metaReais: number | null
}

/** Janela em que um alerta ainda aparece na faixa da busca. */
export const diasAlertaRecente = 7

type OfertaDoAlerta = {
  origem: string | null
  destino: string | null
  programa: string | null
  milhas: number | null
  valorReais: number | null
}

const texto = (v: unknown) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null)
const positivo = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null)

/**
 * Lê o JSON da oferta gravado junto do alerta. O formato esperado segue as colunas de public.ofertas
 * (origem, destino, programa, companhia, milhas, valor_dinheiro_rs), mas nada aqui quebra se faltar campo.
 */
export function lerOfertaDoAlerta(oferta: Json): OfertaDoAlerta {
  const o = typeof oferta === 'object' && oferta !== null && !Array.isArray(oferta) ? oferta : {}
  return {
    origem: texto(o.origem)?.toUpperCase() ?? null,
    destino: texto(o.destino)?.toUpperCase() ?? null,
    programa: texto(o.programa) ?? texto(o.companhia),
    milhas: positivo(o.milhas),
    valorReais: positivo(o.valor_dinheiro_rs),
  }
}

/** Monta o alerta para exibição; devolve null se não der para saber de qual trecho se trata. */
export function montarAlerta(linha: LinhaAlerta): AlertaPrecoAlvo | null {
  const oferta = lerOfertaDoAlerta(linha.oferta)
  const origem = linha.rotas_salvas?.origem ?? oferta.origem
  const destino = linha.rotas_salvas?.destino ?? oferta.destino
  if (!origem || !destino) return null

  return {
    id: linha.id,
    enviadoEm: linha.enviado_em,
    origem,
    destino,
    programa: oferta.programa,
    milhas: oferta.milhas,
    valorReais: oferta.valorReais,
    metaMilhas: linha.rotas_salvas?.preco_alvo_milhas ?? null,
    metaReais: linha.rotas_salvas?.preco_alvo_rs ?? null,
  }
}

/**
 * Mais novos primeiro. A mesma oferta enviada por mais de um canal (WhatsApp, Telegram, e-mail)
 * conta como um alerta só.
 */
export function prepararAlertas(linhas: readonly LinhaAlerta[]): AlertaPrecoAlvo[] {
  const vistas = new Set<string>()
  const alertas: AlertaPrecoAlvo[] = []
  const maisNovasPrimeiro = [...linhas].sort((a, b) => Date.parse(b.enviado_em) - Date.parse(a.enviado_em))
  for (const linha of maisNovasPrimeiro) {
    if (vistas.has(linha.oferta_chave)) continue
    vistas.add(linha.oferta_chave)
    const alerta = montarAlerta(linha)
    if (alerta) alertas.push(alerta)
  }
  return alertas
}

/** Quantos alertas chegaram depois do último momento em que o usuário abriu Minhas rotas. */
export function contarNaoVistos(alertas: readonly AlertaPrecoAlvo[], vistoAte: string | null): number {
  if (!vistoAte) return alertas.length
  const limite = Date.parse(vistoAte)
  return alertas.filter((a) => Date.parse(a.enviadoEm) > limite).length
}

/** O alerta mais novo, se ainda estiver dentro da janela de exibição. */
export function alertaRecente(
  alertas: readonly AlertaPrecoAlvo[],
  agora: Date,
  dias = diasAlertaRecente,
): AlertaPrecoAlvo | null {
  const maisNovo = alertas[0]
  if (!maisNovo) return null
  const idadeEmDias = (agora.getTime() - Date.parse(maisNovo.enviadoEm)) / 86_400_000
  return idadeEmDias <= dias ? maisNovo : null
}

/** "35.000 milhas na TAP Miles&Go, sua meta era 40.000." Devolve null se o alerta não trouxe o preço. */
export function detalheAlerta(alerta: AlertaPrecoAlvo): string | null {
  const emMilhas = alerta.milhas !== null
  const obtido = emMilhas
    ? `${formatarMilhas(alerta.milhas as number)} milhas`
    : alerta.valorReais !== null
      ? formatarReais(alerta.valorReais)
      : null
  if (!obtido) return null

  const meta = emMilhas
    ? alerta.metaMilhas !== null
      ? formatarMilhas(alerta.metaMilhas)
      : null
    : alerta.metaReais !== null
      ? formatarReais(alerta.metaReais)
      : null

  const onde = alerta.programa ? ` na ${alerta.programa}` : ''
  return `${obtido}${onde}${meta ? `, sua meta era ${meta}` : ''}.`
}
