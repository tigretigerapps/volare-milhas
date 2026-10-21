// "Assinar": cria o cliente e a assinatura mensal no Asaas e devolve o link da fatura (PIX, cartão ou boleto).
// Os dados de cartão nunca passam por aqui: o pagamento acontece na página do Asaas.
// A chave do Asaas e o ambiente (sandbox ou produção) vêm dos segredos ASAAS_API_KEY e ASAAS_AMBIENTE.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.118.0'

import { criarAssinatura, criarCliente, ErroAsaas, faturaEmAberto, type ClienteAsaas } from './asaas.ts'
import { soDigitos, validarCpfCnpj } from './documento.ts'

const cabecalhosCors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// deno-lint-ignore no-explicit-any
function responder(corpo: Record<string, any>, status = 200): Response {
  return new Response(JSON.stringify(corpo), { status, headers: { ...cabecalhosCors, 'Content-Type': 'application/json' } })
}
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

const hojeSaoPaulo = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())

const mensagemFalha = 'Não foi possível abrir o pagamento agora. Tente de novo em instantes.'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cabecalhosCors })
  if (req.method !== 'POST') return erro(405, 'metodo_invalido', 'Use POST.')

  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) return erro(401, 'nao_autenticado', 'Entre na sua conta para assinar.')

  const chaveAsaas = Deno.env.get('ASAAS_API_KEY') ?? ''
  if (!chaveAsaas) return erro(503, 'pagamento_indisponivel', 'O pagamento da assinatura ainda não está disponível.')
  const asaas: ClienteAsaas = {
    chave: chaveAsaas,
    ambiente: Deno.env.get('ASAAS_AMBIENTE') === 'producao' ? 'producao' : 'sandbox',
  }

  const db = createClient(Deno.env.get('SUPABASE_URL') ?? '', chaveDeServico(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: sessao, error: erroSessao } = await db.auth.getUser(token)
  if (erroSessao || !sessao.user) return erro(401, 'nao_autenticado', 'Sua sessão expirou. Entre de novo.')
  const usuario = sessao.user

  let corpo: Record<string, unknown>
  try {
    const lido = await req.json()
    if (typeof lido !== 'object' || lido === null) throw new Error('corpo inválido')
    corpo = lido
  } catch {
    return erro(400, 'pedido_invalido', 'Pedido inválido.')
  }
  const acao = corpo.acao === 'fatura' ? 'fatura' : 'assinar'

  const { data: perfil } = await db.from('profiles').select('nome, telefone').eq('id', usuario.id).maybeSingle()
  const { data: assinatura } = await db
    .from('subscriptions')
    .select('plano, status, asaas_customer_id, asaas_subscription_id')
    .eq('user_id', usuario.id)
    .maybeSingle()

  try {
    // Fatura em aberto da assinatura que já existe (pendente ou vencida).
    if (acao === 'fatura') {
      if (!assinatura?.asaas_subscription_id) return erro(404, 'sem_assinatura', 'Você ainda não escolheu um plano.')
      const link = await faturaEmAberto(asaas, assinatura.asaas_subscription_id)
      if (!link) return erro(404, 'sem_fatura', 'Não há fatura em aberto agora.')
      return responder({ fatura_url: link })
    }

    const plano = corpo.plano === 'base' || corpo.plano === 'plus' ? corpo.plano : null
    if (!plano) return erro(400, 'pedido_invalido', 'Escolha um plano.')
    if (assinatura?.status === 'ativo') {
      return erro(409, 'ja_assinante', 'Sua assinatura já está ativa. Para trocar de plano, fale com a equipe da Volare.')
    }

    // Já escolheu um plano antes e não pagou: reaproveita a assinatura e a fatura em aberto, sem cobrar em duplicidade.
    if (assinatura?.asaas_subscription_id && assinatura.plano === plano && assinatura.status !== 'cancelado') {
      const link = await faturaEmAberto(asaas, assinatura.asaas_subscription_id)
      if (link) return responder({ fatura_url: link, reaproveitada: true })
    }

    const documento = validarCpfCnpj(corpo.cpf_cnpj)
    if (!documento) return erro(400, 'documento_invalido', 'CPF ou CNPJ inválido. Confira os números.')

    const { data: dadosPlano } = await db.from('planos').select('nome, preco_mensal').eq('plano', plano).maybeSingle()
    if (!dadosPlano) return erro(404, 'plano_inexistente', 'Plano não encontrado.')

    const nome = perfil?.nome?.trim() || usuario.email?.split('@')[0] || 'Cliente Volare Milhas'
    const celular = perfil?.telefone ? soDigitos(perfil.telefone) : ''
    const clienteId =
      assinatura?.asaas_customer_id ??
      (await criarCliente(asaas, {
        nome,
        cpfCnpj: documento,
        email: usuario.email ?? null,
        celular: celular.length >= 10 ? celular : null,
        userId: usuario.id,
      }))

    const hoje = hojeSaoPaulo()
    const assinaturaId = await criarAssinatura(asaas, {
      clienteId,
      valor: Number(dadosPlano.preco_mensal),
      vencimento: hoje,
      descricao: `Volare Milhas, plano ${dadosPlano.nome}`,
      userId: usuario.id,
    })

    // O status só vira "ativo" quando o webhook confirmar o pagamento.
    const { error: erroGravar } = await db.from('subscriptions').upsert(
      {
        user_id: usuario.id,
        plano,
        status: 'pendente',
        asaas_customer_id: clienteId,
        asaas_subscription_id: assinaturaId,
        data_inicio: hoje,
        proxima_cobranca: hoje,
      },
      { onConflict: 'user_id' },
    )
    if (erroGravar) {
      console.error('falha ao gravar a assinatura', erroGravar.message)
      return erro(500, 'erro', mensagemFalha)
    }

    const link = await faturaEmAberto(asaas, assinaturaId)
    console.log(JSON.stringify({ usuario: usuario.id.slice(0, 8), plano, ambiente: asaas.ambiente, fatura: Boolean(link) }))
    return responder({ fatura_url: link })
  } catch (e) {
    if (e instanceof ErroAsaas) {
      console.error('falha no Asaas', e.message, e.descricao ?? '')
      if (e.status === 400 && e.descricao) return erro(400, 'asaas_recusou', `O Asaas não aceitou os dados: ${e.descricao}`)
      return erro(502, 'asaas_indisponivel', mensagemFalha)
    }
    console.error('falha ao assinar', e instanceof Error ? e.message : JSON.stringify(e))
    return erro(500, 'erro', mensagemFalha)
  }
})
