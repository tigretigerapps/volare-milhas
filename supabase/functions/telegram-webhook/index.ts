// Webhook do bot do Telegram: o assinante toca em "Iniciar" no link de vínculo e esta função grava o chat dele.
// Quem chama é o Telegram, que prova quem é com o segredo do webhook (header X-Telegram-Bot-Api-Secret-Token,
// o mesmo valor do segredo TELEGRAM_WEBHOOK_SECRET). Responde sempre 200 a atualizações válidas para o Telegram não reenviar.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.118.0'

import { interpretar, MENSAGENS, type AtualizacaoTelegram } from './comandos.ts'
import { enviarMensagem } from './telegram.ts'

const responder = (corpo: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } })

function chaveDeServico(): string {
  try {
    const chaves = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}')
    if (typeof chaves.default === 'string') return chaves.default
  } catch {
    // cai na chave legada
  }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
}

async function iguais(a: string, b: string): Promise<boolean> {
  const codificar = (s: string) => crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  const [ha, hb] = (await Promise.all([codificar(a), codificar(b)])).map((h) => new Uint8Array(h))
  let diferenca = 0
  for (let i = 0; i < ha.length; i++) diferenca |= ha[i] ^ hb[i]
  return diferenca === 0
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return responder({ erro: 'Use POST.' }, 405)

  const esperado = Deno.env.get('TELEGRAM_WEBHOOK_SECRET') ?? ''
  const tokenDoBot = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? ''
  if (!esperado || !tokenDoBot) return responder({ erro: 'Bot não configurado.' }, 503)
  if (!(await iguais(req.headers.get('x-telegram-bot-api-secret-token') ?? '', esperado))) {
    return responder({ erro: 'Não autorizado.' }, 401)
  }

  let atualizacao: AtualizacaoTelegram
  try {
    atualizacao = await req.json()
  } catch {
    return responder({ erro: 'Atualização inválida.' }, 400)
  }
  const comando = interpretar(atualizacao)
  if (!comando) return responder({ ok: true })

  const db = createClient(Deno.env.get('SUPABASE_URL') ?? '', chaveDeServico(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const responderNoChat = (texto: string) => enviarMensagem(tokenDoBot, comando.chatId, texto).catch(() => undefined)

  try {
    if (comando.tipo === 'ajuda') {
      await responderNoChat(MENSAGENS.ajuda)
    } else if (comando.tipo === 'parar') {
      await db.from('telegram_vinculos').delete().eq('chat_id', comando.chatId)
      await responderNoChat(MENSAGENS.parado)
    } else {
      const { data: vinculo } = await db
        .from('telegram_vinculos')
        .select('user_id')
        .eq('codigo', comando.codigo)
        .gt('expira_em', new Date().toISOString())
        .maybeSingle()
      if (!vinculo) {
        await responderNoChat(MENSAGENS.codigoInvalido)
        return responder({ ok: true })
      }
      // Um chat recebe os alertas de uma conta só: desfaz o vínculo antigo deste chat, se houver.
      await db.from('telegram_vinculos').delete().eq('chat_id', comando.chatId).neq('user_id', vinculo.user_id)
      const { error } = await db
        .from('telegram_vinculos')
        .update({ chat_id: comando.chatId, vinculado_em: new Date().toISOString(), codigo: null, expira_em: null })
        .eq('user_id', vinculo.user_id)
      if (error) throw error
      console.log(JSON.stringify({ telegram: 'vinculado', usuario: String(vinculo.user_id).slice(0, 8) }))
      await responderNoChat(MENSAGENS.vinculado)
    }
  } catch (e) {
    console.error('falha ao tratar a atualização do Telegram', e instanceof Error ? e.message : JSON.stringify(e))
    // 200 mesmo assim: o Telegram reenviaria a mesma mensagem sem parar.
  }
  return responder({ ok: true })
})
