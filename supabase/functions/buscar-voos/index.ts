// Busca de voos sob demanda. O navegador chama esta função (nunca a API de preços direto):
// aqui ficam o login, a assinatura, os limites do plano, o cache de 24 horas e a fonte dos dados.
// A fonte é o banco fake por padrão; a API real entra trocando o segredo BUSCA_FONTE para "real".
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.118.0'

import {
  chaveDaOferta,
  datasAmostra,
  deveAlertar,
  melhorAcerto,
  ofertaDoAlerta,
  type OfertaMotor,
  type RotaAlerta,
} from './alertas.ts'
import { avaliarDestinos } from './cota.ts'
import { enviarMensagem, mensagemDeAlerta } from './telegram.ts'
import { hojeSaoPaulo, inicioDoDiaSaoPaulo } from './datas.ts'
import { fonteMock, fonteReal, type Fonte } from './fonte.ts'
import type { Obj, PedidoCompanhia } from './tipos.ts'
import { validarPedido } from './validacao.ts'

const cabecalhosCors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function responder(corpo: Obj, status = 200): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...cabecalhosCors, 'Content-Type': 'application/json' },
  })
}

function erro(status: number, codigo: string, mensagem: string, extra: Obj = {}): Response {
  return responder({ codigo, mensagem, ...extra }, status)
}

// A chave secreta nova (sb_secret_...) vem em SUPABASE_SECRET_KEYS; a legada, em SUPABASE_SERVICE_ROLE_KEY.
function chaveDeServico(): string {
  try {
    const chaves = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}')
    if (typeof chaves.default === 'string') return chaves.default
  } catch {
    // cai na chave legada
  }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
}

type ResultadoCompanhia = {
  companhia: string
  status: 'ok' | 'erro'
  busca_id: string | null
  do_cache: boolean
  mensagem?: string
}

// deno-lint-ignore no-explicit-any
async function buscarCompanhia(db: any, fonte: Fonte, pedido: PedidoCompanhia): Promise<ResultadoCompanhia> {
  const falha = (): ResultadoCompanhia => ({
    companhia: pedido.companhia,
    status: 'erro',
    busca_id: null,
    do_cache: false,
    mensagem: `Não foi possível consultar ${pedido.companhia} agora.`,
  })

  try {
    const args = {
      p_origem: pedido.origem,
      p_destino: pedido.destino,
      p_data_voo: pedido.dataIda,
      p_data_volta: pedido.dataVolta,
      p_companhia: pedido.companhia,
    }

    const cache = await db.rpc('busca_em_cache', args)
    if (cache.error) throw cache.error
    if (cache.data) {
      return { companhia: pedido.companhia, status: 'ok', busca_id: cache.data, do_cache: true }
    }

    const resposta = await fonte(pedido)
    if (resposta?.Status?.Erro) {
      // Erro da fonte não vai para o cache: senão a falha ficaria "salva" por 24 horas.
      console.error('fonte respondeu com erro', pedido.companhia, JSON.stringify(resposta.Status.Alerta ?? []))
      return falha()
    }

    const registro = await db.rpc('registrar_busca', { ...args, p_resultado: resposta })
    if (registro.error) throw registro.error
    return { companhia: pedido.companhia, status: 'ok', busca_id: registro.data, do_cache: false }
  } catch (e) {
    console.error('falha ao buscar', pedido.companhia, e instanceof Error ? e.message : JSON.stringify(e))
    return falha()
  }
}

/** Teto de consultas por verificação: protege o pacote da API se houver muitas rotas. */
const MAX_BUSCAS_POR_EXECUCAO = 300

const COLUNAS_OFERTA_MOTOR =
  'origem, destino, data_voo, sentido, companhia, programa, tipo_milhas, numero_voo, conexoes, partida, chegada, milhas, taxas_rs, valor_dinheiro_rs'

type ResumoExecucao = { rotas_verificadas: number; buscas: number; alertas_gerados: number; erros: number }

/**
 * Motor de alertas: busca as rotas salvas ativas (de assinantes ativos) nas datas da janela, compara com o
 * preço-alvo e grava em alertas_enviados o que bateu a meta. Usa o mesmo cache de 24 horas e a mesma fonte
 * das buscas dos usuários, e não gasta a cota diária de ninguém.
 */
// deno-lint-ignore no-explicit-any
async function verificarAlertas(db: any, origem: 'agendador' | 'manual'): Promise<Obj> {
  const agora = new Date()
  const hoje = hojeSaoPaulo(agora)
  const resumo: ResumoExecucao = { rotas_verificadas: 0, buscas: 0, alertas_gerados: 0, erros: 0 }
  let detalhe: string | null = null

  const { data: execucao } = await db.from('alertas_execucoes').insert({ origem }).select('id').single()
  const fonte = Deno.env.get('BUSCA_FONTE') === 'real' ? fonteReal() : fonteMock(db)

  try {
    const { data: rotas, error: erroRotas } = await db
      .from('rotas_salvas')
      .select('id, user_id, origem, destino, data_inicio, data_fim, preco_alvo_milhas, preco_alvo_rs, companhias')
      .eq('ativo', true)
      .gte('data_fim', hoje)
    if (erroRotas) throw erroRotas

    const donos = [...new Set(((rotas ?? []) as RotaAlerta[]).map((r) => r.user_id))]
    const { data: perfis } = await db.from('profiles').select('id, status_assinatura, papel').in('id', donos)
    const elegiveis = new Set(
      ((perfis ?? []) as { id: string; status_assinatura: string; papel: string }[])
        .filter((p) => p.status_assinatura === 'ativo' || p.papel === 'admin')
        .map((p) => p.id),
    )

    // Quem conectou o Telegram também recebe o alerta por lá (se o bot estiver configurado).
    const tokenDoBot = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? ''
    const siteUrl = Deno.env.get('SITE_URL') ?? 'https://volare-milhas.rafael-961.workers.dev'
    const chats = new Map<string, number>()
    if (tokenDoBot && donos.length > 0) {
      const { data: vinculos } = await db.from('telegram_vinculos').select('user_id, chat_id').in('user_id', donos).not('chat_id', 'is', null)
      for (const v of (vinculos ?? []) as { user_id: string; chat_id: number }[]) chats.set(v.user_id, v.chat_id)
    }

    for (const rota of (rotas ?? []) as RotaAlerta[]) {
      if (!elegiveis.has(rota.user_id) || rota.companhias.length === 0) continue
      const datas = datasAmostra(rota.data_inicio, rota.data_fim, hoje)
      const tarefas = rota.companhias.flatMap((companhia) => datas.map((data) => ({ companhia, data })))
      if (tarefas.length === 0) continue
      if (resumo.buscas + tarefas.length > MAX_BUSCAS_POR_EXECUCAO) {
        detalhe = `Limite de ${MAX_BUSCAS_POR_EXECUCAO} consultas por verificação atingido; as rotas restantes ficam para a próxima.`
        break
      }

      resumo.rotas_verificadas++
      const resultados = await Promise.all(
        tarefas.map((t) =>
          buscarCompanhia(db, fonte, {
            origem: rota.origem,
            destino: rota.destino,
            dataIda: t.data,
            dataVolta: null,
            companhia: t.companhia,
          }),
        ),
      )
      resumo.buscas += tarefas.length
      resumo.erros += resultados.filter((r) => r.status === 'erro').length

      const buscaIds = resultados.flatMap((r) => (r.status === 'ok' && r.busca_id ? [r.busca_id] : []))
      if (buscaIds.length === 0) continue
      const { data: ofertas, error: erroOfertas } = await db
        .from('ofertas')
        .select(COLUNAS_OFERTA_MOTOR)
        .in('busca_id', buscaIds)
      if (erroOfertas) throw erroOfertas

      const acerto = melhorAcerto(rota, (ofertas ?? []) as OfertaMotor[])
      if (!acerto) continue

      const { data: ultimo } = await db
        .from('alertas_enviados')
        .select('enviado_em, oferta')
        .eq('rota_id', rota.id)
        .order('enviado_em', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!deveAlertar(ultimo, acerto, agora)) continue

      const { error: erroAlerta } = await db.from('alertas_enviados').insert({
        user_id: rota.user_id,
        rota_id: rota.id,
        oferta_chave: chaveDaOferta(rota.id, acerto),
        oferta: ofertaDoAlerta(acerto),
        canal: 'app',
      })
      // 23505: a mesma oferta já tinha gerado este alerta (corrida entre duas verificações).
      if (erroAlerta && erroAlerta.code !== '23505') {
        console.error('falha ao gravar o alerta', erroAlerta.message)
        resumo.erros++
      } else if (!erroAlerta) {
        resumo.alertas_gerados++
        const chatId = chats.get(rota.user_id)
        if (chatId && tokenDoBot) {
          try {
            const envio = await enviarMensagem(tokenDoBot, chatId, mensagemDeAlerta(rota, acerto, siteUrl))
            if (envio.ok) {
              // Registra também o canal telegram (a mesma oferta, outro canal; o site junta os dois num alerta só).
              await db.from('alertas_enviados').insert({
                user_id: rota.user_id,
                rota_id: rota.id,
                oferta_chave: chaveDaOferta(rota.id, acerto),
                oferta: ofertaDoAlerta(acerto),
                canal: 'telegram',
              })
            } else if (envio.bloqueado) {
              // O usuário bloqueou o bot: para de tentar até ele conectar de novo.
              await db.from('telegram_vinculos').delete().eq('user_id', rota.user_id)
              console.log(JSON.stringify({ telegram: 'desvinculado', usuario: rota.user_id.slice(0, 8), http: envio.status }))
            } else {
              console.error('falha ao enviar pelo Telegram', envio.status)
              resumo.erros++
            }
          } catch (e) {
            console.error('falha ao enviar pelo Telegram', e instanceof Error ? e.message : JSON.stringify(e))
            resumo.erros++
          }
        }
      }
    }
  } catch (e) {
    console.error('falha na verificação de alertas', e instanceof Error ? e.message : JSON.stringify(e))
    resumo.erros++
    detalhe = 'A verificação parou por um erro. Veja os registros da função.'
  }

  if (execucao?.id) {
    await db.from('alertas_execucoes').update({ concluido_em: new Date().toISOString(), detalhe, ...resumo }).eq('id', execucao.id)
  }
  console.log(JSON.stringify({ alertas: origem, ...resumo }))
  return { ...resumo, detalhe }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cabecalhosCors })
  if (req.method !== 'POST') return erro(405, 'metodo_invalido', 'Use POST.')

  // Cliente com a chave de serviço: só é usado depois de identificar o usuário e checar o plano dele.
  const db = createClient(Deno.env.get('SUPABASE_URL') ?? '', chaveDeServico(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // O agendador do banco (pg_cron) não tem usuário: prova quem é com um segredo guardado no Vault.
  const segredoAgendador = req.headers.get('x-cron-secret')
  if (segredoAgendador) {
    const { data: valido } = await db.rpc('validar_segredo_cron', { p_segredo: segredoAgendador })
    if (valido !== true) return erro(401, 'nao_autenticado', 'Segredo do agendador inválido.')
    return responder({ ok: true, ...(await verificarAlertas(db, 'agendador')) })
  }

  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) return erro(401, 'nao_autenticado', 'Entre na sua conta para buscar.')

  const { data: sessao, error: erroSessao } = await db.auth.getUser(token)
  if (erroSessao || !sessao.user) return erro(401, 'nao_autenticado', 'Sua sessão expirou. Entre de novo.')
  const usuario = sessao.user

  let corpo: unknown
  try {
    corpo = await req.json()
  } catch {
    return erro(400, 'pedido_invalido', 'Pedido de busca inválido.')
  }

  // Painel administrativo: "Verificar agora" roda o motor de alertas na hora.
  if (typeof corpo === 'object' && corpo !== null && (corpo as Record<string, unknown>).acao === 'verificar_alertas') {
    const { data: quem } = await db.from('profiles').select('papel').eq('id', usuario.id).maybeSingle()
    if (quem?.papel !== 'admin') return erro(403, 'sem_permissao', 'Só administradores podem rodar a verificação.')
    return responder({ ok: true, ...(await verificarAlertas(db, 'manual')) })
  }

  const agora = new Date()
  const validacao = validarPedido(corpo, hojeSaoPaulo(agora))
  if (!validacao.ok) return erro(400, validacao.erro.codigo, validacao.erro.mensagem)
  const pedido = validacao.pedido

  const { data: perfil } = await db
    .from('profiles')
    .select('plano, status_assinatura, papel')
    .eq('id', usuario.id)
    .maybeSingle()

  const admin = perfil?.papel === 'admin'
  if (!admin && perfil?.status_assinatura !== 'ativo') {
    return erro(403, 'assinatura_inativa', 'Sua assinatura não está ativa. Regularize para continuar buscando.')
  }

  // Limite de destinos por dia, definido pelo plano (administrador não tem limite).
  let limite: number | null = null
  let nomePlano = ''
  if (!admin) {
    const { data: plano } = await db
      .from('planos')
      .select('nome, destinos_por_dia')
      .eq('plano', perfil?.plano ?? '')
      .maybeSingle()
    limite = plano?.destinos_por_dia ?? 0
    nomePlano = plano?.nome ?? ''
  }

  const { data: consultasDeHoje } = await db
    .from('consultas_log')
    .select('origem, destino')
    .eq('user_id', usuario.id)
    .gte('consultado_em', inicioDoDiaSaoPaulo(agora))

  const avaliacao = avaliarDestinos(consultasDeHoje ?? [], pedido, limite)
  if (!avaliacao.permitido) {
    return erro(
      429,
      'limite_destinos',
      `Você já pesquisou ${limite} destinos diferentes hoje${nomePlano ? ` no plano ${nomePlano}` : ''}. ` +
        'Repita uma rota já pesquisada ou volte amanhã.',
      { uso: { destinos_usados: avaliacao.usados, destinos_limite: limite } },
    )
  }

  const modo = Deno.env.get('BUSCA_FONTE') === 'real' ? 'real' : 'mock'
  const fonte = modo === 'real' ? fonteReal() : fonteMock(db)

  const resultados = await Promise.all(
    pedido.companhias.map((companhia) =>
      buscarCompanhia(db, fonte, {
        origem: pedido.origem,
        destino: pedido.destino,
        dataIda: pedido.dataIda,
        dataVolta: pedido.dataVolta,
        companhia,
      }),
    ),
  )

  // Só gasta a cota do usuário se alguma companhia realmente respondeu.
  const algumaRespondeu = resultados.some((r) => r.status === 'ok')
  if (algumaRespondeu) {
    const { error: erroLog } = await db.from('consultas_log').insert({
      user_id: usuario.id,
      origem: pedido.origem,
      destino: pedido.destino,
      data_voo: pedido.dataIda,
      companhias: pedido.companhias,
      do_cache: resultados.every((r) => r.do_cache),
    })
    if (erroLog) console.error('falha ao registrar a consulta', erroLog.message)
  }

  const destinosUsados = algumaRespondeu && !avaliacao.jaPesquisada ? avaliacao.usados + 1 : avaliacao.usados
  console.log(
    JSON.stringify({
      usuario: usuario.id.slice(0, 8),
      rota: `${pedido.origem}-${pedido.destino}`,
      modo,
      companhias: resultados.map((r) => `${r.companhia}:${r.status}${r.do_cache ? ':cache' : ''}`),
    }),
  )

  return responder({
    modo,
    buscas: resultados,
    uso: { destinos_usados: destinosUsados, destinos_limite: limite },
  })
})
