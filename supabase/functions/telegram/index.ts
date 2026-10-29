// "Conectar Telegram": cria o código de uso único e devolve o link que abre o bot já com ele.
// O vínculo só se completa quando o assinante toca em Iniciar no Telegram (função telegram-webhook).
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.118.0'

import { gerarCodigo, linkDoBot, MINUTOS_DE_VALIDADE } from './vinculo.ts'

const cabecalhosCors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// deno-lint-ignore no-explicit-any
const responder = (corpo: Record<string, any>, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { ...cabecalhosCors, 'Content-Type': 'application/json' } })
const erro = (status: number, codigo: string, mensagem: string) => responder({ codigo, mensagem }, status)

function chaveDeServico(): string {
  try {
    const chaves = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}')
    if (typeof chaves.default === 'string') return chaves.default
  } catch {
    // cai na chave legada
  }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cabecalhosCors })
  if (req.method !== 'POST') return erro(405, 'metodo_invalido', 'Use POST.')

  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) return erro(401, 'nao_autenticado', 'Entre na sua conta para conectar o Telegram.')

  const usuarioDoBot = Deno.env.get('TELEGRAM_BOT_USERNAME') ?? ''
  if (!usuarioDoBot) return erro(503, 'telegram_indisponivel', 'Os alertas por Telegram ainda não estão disponíveis.')

  const db = createClient(Deno.env.get('SUPABASE_URL') ?? '', chaveDeServico(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: sessao, error: erroSessao } = await db.auth.getUser(token)
  if (erroSessao || !sessao.user) return erro(401, 'nao_autenticado', 'Sua sessão expirou. Entre de novo.')

  const codigo = gerarCodigo()
  const link = linkDoBot(usuarioDoBot, codigo)
  if (!link) return erro(503, 'telegram_indisponivel', 'Os alertas por Telegram ainda não estão disponíveis.')

  // Só troca o código e a validade; se já havia um chat vinculado, ele continua até o novo vínculo ser concluído.
  const { error } = await db.from('telegram_vinculos').upsert(
    {
      user_id: sessao.user.id,
      codigo,
      expira_em: new Date(Date.now() + MINUTOS_DE_VALIDADE * 60_000).toISOString(),
    },
    { onConflict: 'user_id' },
  )
  if (error) {
    console.error('falha ao criar o código do Telegram', error.message)
    return erro(500, 'erro', 'Não foi possível conectar agora. Tente de novo em instantes.')
  }
  return responder({ url: link, minutos: MINUTOS_DE_VALIDADE })
})
