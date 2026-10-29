// Diagnóstico do Asaas, SÓ LEITURA: mostra o estado das assinaturas no Asaas ao lado do que temos no banco e a
// configuração do webhook. Serve para achar divergências sem abrir o painel do Asaas.
// Quem chama prova quem é com o segredo do agendador (Vault); a chave do Asaas nunca sai do servidor.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.118.0'

import { consultar, type Ambiente } from './cliente.ts'
import { divergencia, resumirCobranca, resumirWebhook } from './resumo.ts'

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

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return responder({ erro: 'Use POST.' }, 405)

  const db = createClient(Deno.env.get('SUPABASE_URL') ?? '', chaveDeServico(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const segredo = req.headers.get('x-cron-secret') ?? ''
  const { data: valido } = await db.rpc('validar_segredo_cron', { p_segredo: segredo })
  if (valido !== true) return responder({ erro: 'Não autorizado.' }, 401)

  const chave = Deno.env.get('ASAAS_API_KEY') ?? ''
  if (!chave) return responder({ erro: 'ASAAS_API_KEY não configurada.' }, 503)
  const ambiente: Ambiente = Deno.env.get('ASAAS_AMBIENTE') === 'producao' ? 'producao' : 'sandbox'

  try {
    const webhooks = await consultar(ambiente, chave, '/webhooks?limit=20')
    const { data: linhas, error } = await db
      .from('subscriptions')
      .select('user_id, plano, status, acesso_ate, proxima_cobranca, asaas_subscription_id')
      .not('asaas_subscription_id', 'is', null)
    if (error) throw error

    const assinaturas = []
    for (const linha of linhas ?? []) {
      const id = encodeURIComponent(linha.asaas_subscription_id)
      const [detalhe, cobrancas] = await Promise.all([
        consultar(ambiente, chave, `/subscriptions/${id}`),
        consultar(ambiente, chave, `/subscriptions/${id}/payments?limit=10`),
      ])
      const lista = (Array.isArray(cobrancas.corpo.data) ? cobrancas.corpo.data : []).map(resumirCobranca)
      const asaas = { status: detalhe.corpo.status ?? null, deleted: detalhe.corpo.deleted === true }
      assinaturas.push({
        usuario: String(linha.user_id).slice(0, 8),
        plano: linha.plano,
        nossa: { status: linha.status, acessoAte: linha.acesso_ate, proximaCobranca: linha.proxima_cobranca },
        asaas: { ...asaas, valor: detalhe.corpo.value ?? null, proximoVencimento: detalhe.corpo.nextDueDate ?? null, http: detalhe.status },
        cobrancas: lista,
        divergencia: divergencia({ status: linha.status, acessoAte: linha.acesso_ate }, asaas, lista),
      })
    }

    return responder({
      ambiente,
      webhooks: {
        http: webhooks.status,
        itens: (Array.isArray(webhooks.corpo.data) ? webhooks.corpo.data : []).map(resumirWebhook),
      },
      assinaturas,
    })
  } catch (e) {
    console.error('falha no diagnóstico', e instanceof Error ? e.message : JSON.stringify(e))
    return responder({ erro: 'Falha ao consultar o Asaas.' }, 502)
  }
})
