// "Quero essa oferta": registra o lead do assinante e cria a solicitação de orçamento no CRM Iddas.
// Por padrão roda em SIMULAÇÃO: grava o lead e devolve o pedido que seria enviado, sem chamar o CRM.
// O envio real liga com os segredos IDDAS_MODO=real e IDDAS_CHAVE (nunca no navegador, nunca no código).
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.118.0'

import { criarSolicitacao } from './iddas.ts'
import { montarSolicitacao, nomeDoCliente, normalizarTelefone, type OfertaLinha } from './payload.ts'
import { validarPedidoLead } from './validacao.ts'

const cabecalhosCors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// deno-lint-ignore no-explicit-any
function responder(corpo: Record<string, any>, status = 200): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...cabecalhosCors, 'Content-Type': 'application/json' },
  })
}

const erro = (status: number, codigo: string, mensagem: string) => responder({ codigo, mensagem }, status)

/** Máximo de leads por assinante em 24 horas (proteção contra abuso). */
const MAX_LEADS_POR_DIA = 10

function chaveDeServico(): string {
  try {
    const chaves = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}')
    if (typeof chaves.default === 'string') return chaves.default
  } catch {
    // cai na chave legada
  }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
}

const COLUNAS_OFERTA =
  'origem, destino, data_voo, sentido, companhia, programa, tipo_milhas, numero_voo, cabine, conexoes, partida, chegada, milhas, taxas_rs, valor_dinheiro_rs'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cabecalhosCors })
  if (req.method !== 'POST') return erro(405, 'metodo_invalido', 'Use POST.')

  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) return erro(401, 'nao_autenticado', 'Entre na sua conta para continuar.')

  const db = createClient(Deno.env.get('SUPABASE_URL') ?? '', chaveDeServico(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: sessao, error: erroSessao } = await db.auth.getUser(token)
  if (erroSessao || !sessao.user) return erro(401, 'nao_autenticado', 'Sua sessão expirou. Entre de novo.')
  const usuario = sessao.user

  let corpo: unknown
  try {
    corpo = await req.json()
  } catch {
    return erro(400, 'pedido_invalido', 'Pedido inválido.')
  }
  const validacao = validarPedidoLead(corpo)
  if (!validacao.ok) return erro(400, 'pedido_invalido', validacao.mensagem)
  const pedido = validacao.pedido

  const { data: perfil } = await db
    .from('profiles')
    .select('nome, telefone, custo_milheiro, status_assinatura, papel')
    .eq('id', usuario.id)
    .maybeSingle()

  const admin = perfil?.papel === 'admin'
  if (!admin && perfil?.status_assinatura !== 'ativo') {
    return erro(403, 'assinatura_inativa', 'Sua assinatura não está ativa. Regularize para falar com a equipe.')
  }

  // Sem telefone válido a equipe não consegue chamar o cliente: avisa antes de registrar qualquer coisa.
  if (!perfil?.telefone || !normalizarTelefone(perfil.telefone)) {
    return erro(
      422,
      'telefone_invalido',
      'Cadastre um telefone com DDD na página Conta para a equipe poder falar com você.',
    )
  }

  const { data: oferta } = await db.from('ofertas').select(COLUNAS_OFERTA).eq('id', pedido.ofertaId).maybeSingle()
  if (!oferta) return erro(404, 'oferta_nao_encontrada', 'Esta oferta não está mais disponível. Faça a busca de novo.')

  const desde = new Date(Date.now() - 24 * 3_600_000).toISOString()

  // Mesma oferta pedida de novo em 24 horas: devolve o lead que já existe, sem duplicar no CRM.
  // Se aquele lead falhou no CRM, este novo clique tenta enviar o mesmo lead outra vez.
  const { data: existente } = await db
    .from('leads')
    .select('id, crm_status')
    .eq('user_id', usuario.id)
    .eq('oferta_id', pedido.ofertaId)
    .gte('created_at', desde)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (existente && existente.crm_status !== 'falhou') {
    return responder({
      lead_id: existente.id,
      referencia: `VM-${String(existente.id).slice(0, 8).toUpperCase()}`,
      ja_existia: true,
      enviado_ao_crm: existente.crm_status === 'enviado',
    })
  }

  let lead: { id: string }
  if (existente) {
    lead = { id: existente.id }
  } else {
    if (!admin) {
      const { count } = await db
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', usuario.id)
        .gte('created_at', desde)
      if ((count ?? 0) >= MAX_LEADS_POR_DIA) {
        return erro(429, 'limite_leads', 'Você já enviou muitos pedidos hoje. Nossa equipe vai falar com você em breve.')
      }
    }

    // Grava primeiro: o pedido do cliente nunca se perde, mesmo que o CRM esteja fora do ar.
    const { data: novo, error: erroLead } = await db
      .from('leads')
      .insert({ user_id: usuario.id, oferta_id: pedido.ofertaId, oferta: oferta as never })
      .select('id')
      .single()
    if (erroLead || !novo) {
      console.error('falha ao gravar o lead', erroLead?.message)
      return erro(500, 'erro', 'Não foi possível registrar seu pedido agora. Tente de novo em instantes.')
    }
    lead = novo
  }

  const referencia = `VM-${String(lead.id).slice(0, 8).toUpperCase()}`
  const fonteDados = Deno.env.get('BUSCA_FONTE') === 'real' ? 'real' : 'mock'
  const solicitacao = montarSolicitacao(
    {
      nome: nomeDoCliente(perfil.nome, usuario.email ?? null),
      email: usuario.email ?? null,
      telefone: perfil.telefone,
      oferta: oferta as OfertaLinha,
      dataIdaBusca: pedido.dataIda,
      dataVoltaBusca: pedido.dataVolta,
      cidadeOrigem: pedido.cidadeOrigem,
      cidadeDestino: pedido.cidadeDestino,
      milheiroCliente: perfil.custo_milheiro,
      referencia,
      fonteDados,
    },
    Deno.env.get('IDDAS_CANAL') || undefined,
  )

  const chaveCrm = Deno.env.get('IDDAS_CHAVE') ?? ''
  const modoReal = Deno.env.get('IDDAS_MODO') === 'real' && chaveCrm !== ''

  if (!modoReal) {
    await db.from('leads').update({ crm_status: 'simulado' }).eq('id', lead.id)
    console.log(JSON.stringify({ usuario: usuario.id.slice(0, 8), lead: referencia, crm: 'simulado' }))
    return responder({ modo: 'simulado', lead_id: lead.id, referencia, ja_existia: false, enviado_ao_crm: false, solicitacao })
  }

  try {
    const idCrm = await criarSolicitacao(chaveCrm, solicitacao)
    await db
      .from('leads')
      .update({ crm_status: 'enviado', crm_id: idCrm, crm_enviado_em: new Date().toISOString(), crm_erro: null })
      .eq('id', lead.id)
    console.log(JSON.stringify({ usuario: usuario.id.slice(0, 8), lead: referencia, crm: 'enviado', id_crm: idCrm }))
    return responder({ modo: 'real', lead_id: lead.id, referencia, ja_existia: false, enviado_ao_crm: true })
  } catch (e) {
    const motivo = e instanceof Error ? e.message : 'erro desconhecido'
    console.error('falha ao enviar ao CRM', referencia, motivo)
    await db.from('leads').update({ crm_status: 'falhou', crm_erro: motivo.slice(0, 500) }).eq('id', lead.id)
    // O lead está salvo e entra na fila de reenvio: para o cliente, o pedido foi recebido.
    return responder({ modo: 'real', lead_id: lead.id, referencia, ja_existia: false, enviado_ao_crm: false })
  }
})
