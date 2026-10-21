// Webhook do Asaas: recebe pagamentos e mudanças da assinatura e atualiza public.subscriptions
// (um gatilho do banco copia a situação para o perfil, que é o que libera ou bloqueia o acesso).
// Esta função não usa login de usuário: quem chama é o Asaas, e prova quem é com o token do webhook
// (segredo ASAAS_WEBHOOK_TOKEN, o mesmo cadastrado no painel do Asaas, no header asaas-access-token).
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.118.0'

import { efeitoDoEvento, situacaoFinal, type EventoAsaas } from './eventos.ts'

function responder(corpo: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } })
}

function chaveDeServico(): string {
  try {
    const chaves = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}')
    if (typeof chaves.default === 'string') return chaves.default
  } catch {
    // cai na chave legada
  }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
}

/** Comparação que não vaza, pelo tempo de resposta, quantos caracteres do token estavam certos. */
async function iguais(a: string, b: string): Promise<boolean> {
  const codificar = (s: string) => crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  const [ha, hb] = (await Promise.all([codificar(a), codificar(b)])).map((h) => new Uint8Array(h))
  let diferenca = 0
  for (let i = 0; i < ha.length; i++) diferenca |= ha[i] ^ hb[i]
  return diferenca === 0
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return responder({ erro: 'Use POST.' }, 405)

  const esperado = Deno.env.get('ASAAS_WEBHOOK_TOKEN') ?? ''
  if (!esperado) return responder({ erro: 'Webhook não configurado.' }, 503)
  const recebido = req.headers.get('asaas-access-token') ?? ''
  if (!(await iguais(recebido, esperado))) return responder({ erro: 'Token inválido.' }, 401)

  let evento: EventoAsaas
  try {
    evento = await req.json()
    if (typeof evento?.id !== 'string' || typeof evento?.event !== 'string') throw new Error('evento sem id')
  } catch {
    return responder({ erro: 'Evento inválido.' }, 400)
  }

  const db = createClient(Deno.env.get('SUPABASE_URL') ?? '', chaveDeServico(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Já visto: o Asaas entrega "pelo menos uma vez", então repetição é normal. Responde 200 sem refazer nada.
  const { error: erroEvento } = await db.from('asaas_eventos').insert({ id: evento.id, tipo: evento.event })
  if (erroEvento) {
    if (erroEvento.code === '23505') return responder({ ok: true, repetido: true })
    console.error('falha ao registrar o evento', erroEvento.message)
    return responder({ erro: 'Falha ao registrar o evento.' }, 500)
  }

  const desfazerRegistro = () => db.from('asaas_eventos').delete().eq('id', evento.id)

  try {
    const efeito = efeitoDoEvento(evento)
    if (!efeito) return responder({ ok: true, ignorado: true })

    const { data: assinatura, error: erroBusca } = await db
      .from('subscriptions')
      .select('id, status')
      .eq('asaas_subscription_id', efeito.assinaturaId)
      .maybeSingle()
    if (erroBusca) throw erroBusca
    if (!assinatura) {
      // Assinatura criada fora da plataforma (ou em outro ambiente): nada a atualizar.
      console.log(JSON.stringify({ evento: evento.event, assinatura: 'desconhecida' }))
      return responder({ ok: true, ignorado: true })
    }

    const situacao = situacaoFinal(assinatura.status, efeito.situacao)
    const { error: erroAtualizar } = await db
      .from('subscriptions')
      .update({ status: situacao, ...(efeito.proximaCobranca ? { proxima_cobranca: efeito.proximaCobranca } : {}) })
      .eq('id', assinatura.id)
    if (erroAtualizar) throw erroAtualizar

    console.log(JSON.stringify({ evento: evento.event, de: assinatura.status, para: situacao }))
    return responder({ ok: true })
  } catch (e) {
    console.error('falha ao processar o evento', evento.event, e instanceof Error ? e.message : JSON.stringify(e))
    // Libera o id para o Asaas poder reenviar e a próxima tentativa processar de verdade.
    await desfazerRegistro()
    return responder({ erro: 'Falha ao processar.' }, 500)
  }
})
