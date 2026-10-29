// Aviso de alerta pelo Telegram. O token do bot só existe no servidor (segredo TELEGRAM_BOT_TOKEN).
import type { Acerto, RotaAlerta } from './alertas.ts'

export type Requisicao = typeof fetch
export type ResultadoEnvio = { ok: boolean; status: number; /** O usuário bloqueou o bot ou apagou a conversa. */ bloqueado: boolean }

export async function enviarMensagem(tokenDoBot: string, chatId: number, texto: string, req: Requisicao = fetch): Promise<ResultadoEnvio> {
  const resposta = await req(`https://api.telegram.org/bot${tokenDoBot}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Sem parse_mode: o texto vai como está, sem precisar escapar nada.
    body: JSON.stringify({ chat_id: chatId, text: texto, disable_web_page_preview: true }),
    signal: AbortSignal.timeout(15_000),
  })
  // 403: o usuário bloqueou o bot. 400 "chat not found": a conversa não existe mais.
  return { ok: resposta.ok, status: resposta.status, bloqueado: resposta.status === 403 || resposta.status === 400 }
}

const milhas = (n: number) => n.toLocaleString('pt-BR')
const reais = (n: number) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const dataBR = (iso: string) => iso.split('-').reverse().join('/')

/** Texto do alerta: a rota, o preço que bateu a meta, o voo e o link para ver no site. */
export function mensagemDeAlerta(rota: RotaAlerta, acerto: Acerto, siteUrl: string): string {
  const o = acerto.oferta
  const onde = o.programa ?? o.companhia
  const emMilhas = acerto.criterio === 'milhas' && o.milhas !== null
  const preco = emMilhas ? `${milhas(o.milhas as number)} milhas` : reais(o.valor_dinheiro_rs as number)
  const meta = emMilhas
    ? rota.preco_alvo_milhas !== null
      ? `${milhas(rota.preco_alvo_milhas)} milhas`
      : null
    : rota.preco_alvo_rs !== null
      ? reais(rota.preco_alvo_rs)
      : null

  return [
    `Alerta de preço: ${rota.origem} para ${rota.destino}`,
    `${preco} na ${onde}${meta ? `, sua meta era ${meta}` : ''}.`,
    `${o.numero_voo ? `Voo ${o.numero_voo}, ` : ''}${dataBR(o.data_voo)}.`,
    `Ver no site: ${siteUrl.replace(/\/$/, '')}/rotas`,
  ].join('\n')
}
