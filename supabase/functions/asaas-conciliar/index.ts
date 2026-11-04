// Conferência diária das assinaturas com o Asaas: corrige o que o webhook deveria ter avisado e não avisou
// (cancelamento feito no painel do Asaas, pagamento ou atraso que não chegaram). Só consulta o Asaas (GET);
// a única escrita é na nossa tabela subscriptions. Com { "simular": true } mostra o que mudaria, sem mudar nada.
// Quem chama prova quem é com o segredo do agendador (Vault); a chave do Asaas nunca sai do servidor.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.118.0'

import { consultar, type Ambiente } from './cliente.ts'
import { decidirConciliacao } from './conciliacao.ts'

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

const hojeSaoPaulo = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return responder({ erro: 'Use POST.' }, 405)

  const db = createClient(Deno.env.get('SUPABASE_URL') ?? '', chaveDeServico(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: valido } = await db.rpc('validar_segredo_cron', { p_segredo: req.headers.get('x-cron-secret') ?? '' })
  if (valido !== true) return responder({ erro: 'Não autorizado.' }, 401)

  const chave = Deno.env.get('ASAAS_API_KEY') ?? ''
  if (!chave) return responder({ erro: 'ASAAS_API_KEY não configurada.' }, 503)
  const ambiente: Ambiente = Deno.env.get('ASAAS_AMBIENTE') === 'producao' ? 'producao' : 'sandbox'

  let simular = false
  try {
    const corpo = await req.json()
    simular = corpo?.simular === true
  } catch {
    // sem corpo: aplica as correções
  }

  const hoje = hojeSaoPaulo()
  const resumo = { verificadas: 0, corrigidas: [] as Record<string, unknown>[], erros: 0, simulado: simular }

  const { data: linhas, error } = await db
    .from('subscriptions')
    .select('user_id, status, acesso_ate, proxima_cobranca, asaas_subscription_id')
    .in('status', ['ativo', 'pendente', 'inadimplente'])
    .not('asaas_subscription_id', 'is', null)
  if (error) {
    console.error('falha ao ler as assinaturas', error.message)
    return responder({ erro: 'Falha ao ler as assinaturas.' }, 500)
  }

  for (const linha of linhas ?? []) {
    try {
      const id = encodeURIComponent(linha.asaas_subscription_id)
      const [detalhe, cobrancas] = await Promise.all([
        consultar(ambiente, chave, `/subscriptions/${id}`),
        consultar(ambiente, chave, `/subscriptions/${id}/payments?limit=50`),
      ])
      // Resposta inesperada do Asaas (chave errada, indisponível): não corrige nada com base em dado incompleto.
      if (detalhe.status !== 200 || cobrancas.status !== 200) {
        resumo.erros++
        continue
      }
      resumo.verificadas++

      const lista = (Array.isArray(cobrancas.corpo.data) ? cobrancas.corpo.data : []).map((p: { status?: unknown; dueDate?: unknown }) => ({
        status: String(p.status ?? ''),
        dueDate: String(p.dueDate ?? ''),
      }))
      const correcao = decidirConciliacao(
        { status: linha.status, acessoAte: linha.acesso_ate, proximaCobranca: linha.proxima_cobranca },
        { status: detalhe.corpo.status ?? null, deleted: detalhe.corpo.deleted === true },
        lista,
        hoje,
      )
      if (!correcao) continue

      const { motivo, ...mudanca } = correcao
      if (!simular) {
        const { error: erroAtualizar } = await db.from('subscriptions').update(mudanca).eq('user_id', linha.user_id)
        if (erroAtualizar) throw erroAtualizar
      }
      resumo.corrigidas.push({ usuario: String(linha.user_id).slice(0, 8), de: linha.status, para: mudanca.status, motivo })
    } catch (e) {
      console.error('falha ao conferir uma assinatura', e instanceof Error ? e.message : JSON.stringify(e))
      resumo.erros++
    }
  }

  console.log(JSON.stringify({ conciliacao: resumo.simulado ? 'simulada' : 'aplicada', verificadas: resumo.verificadas, corrigidas: resumo.corrigidas.length, erros: resumo.erros }))
  return responder(resumo)
})
