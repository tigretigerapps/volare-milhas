// Envio de mensagens pelo bot do Telegram. O token do bot só existe no servidor (segredo TELEGRAM_BOT_TOKEN).

export type Requisicao = typeof fetch

export type ResultadoEnvio = { ok: boolean; status: number; /** O usuário bloqueou o bot ou apagou a conversa. */ bloqueado: boolean }

export async function enviarMensagem(
  tokenDoBot: string,
  chatId: number,
  texto: string,
  req: Requisicao = fetch,
): Promise<ResultadoEnvio> {
  const resposta = await req(`https://api.telegram.org/bot${tokenDoBot}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Sem parse_mode: o texto vai como está, sem precisar escapar nada.
    body: JSON.stringify({ chat_id: chatId, text: texto, disable_web_page_preview: true }),
    signal: AbortSignal.timeout(15_000),
  })
  // 403: o usuário bloqueou o bot. 400 "chat not found": a conversa não existe mais.
  const bloqueado = resposta.status === 403 || resposta.status === 400
  return { ok: resposta.ok, status: resposta.status, bloqueado }
}
