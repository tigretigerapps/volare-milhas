import { useCallback, useEffect, useState } from 'react'

import { supabase } from '@/integrations/supabase/client'
import type { Tables } from '@/integrations/supabase/types'
import { lerErroFuncao } from '@/lib/busca'

type Resultado = { erro: string | null }

export type LeadAdmin = Tables<'leads'> & { profiles: Pick<Tables<'profiles'>, 'nome' | 'telefone'> | null }
export type AssinanteAdmin = Tables<'profiles'> & { assinatura: Tables<'subscriptions'> | null }
export type Plano = Tables<'planos'>
export type ExecucaoAlertas = Tables<'alertas_execucoes'>

const falhaCarga = 'Não foi possível carregar. Recarregue a página.'

/** Estado de uma lista carregada do banco (as políticas só liberam isto a administradores). */
function useLista<T>(carregar: () => PromiseLike<{ data: T[] | null; error: unknown }>) {
  const [itens, setItens] = useState<T[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erroCarga, setErroCarga] = useState<string | null>(null)

  const aplicar = useCallback(({ data, error }: { data: T[] | null; error: unknown }) => {
    if (error || !data) {
      console.error('Erro ao carregar o painel', error)
      setErroCarga(falhaCarga)
    } else {
      setItens(data)
      setErroCarga(null)
    }
    setCarregando(false)
  }, [])

  const recarregar = useCallback(async () => aplicar(await carregar()), [aplicar, carregar])

  useEffect(() => {
    let cancelado = false
    void Promise.resolve(carregar()).then((resultado) => {
      if (!cancelado) aplicar(resultado)
    })
    return () => {
      cancelado = true
    }
  }, [aplicar, carregar])

  return { itens, setItens, carregando, erroCarga, recarregar }
}

const carregarLeads = () =>
  supabase.from('leads').select('*, profiles(nome, telefone)').order('created_at', { ascending: false }).limit(200)

export function useLeadsAdmin() {
  const { itens, setItens, carregando, erroCarga, recarregar } = useLista<LeadAdmin>(carregarLeads)

  const mudarStatus = useCallback(
    async (id: string, status: string): Promise<Resultado> => {
      const { error } = await supabase.from('leads').update({ status }).eq('id', id)
      if (error) {
        console.error('Erro ao mudar o status do lead', error)
        return { erro: 'Não foi possível mudar o status. Tente de novo.' }
      }
      setItens((atuais) => atuais.map((l) => (l.id === id ? { ...l, status } : l)))
      return { erro: null }
    },
    [setItens],
  )

  const reenviar = useCallback(
    async (id: string): Promise<Resultado> => {
      const { error } = await supabase.functions.invoke('criar-lead', { body: { acao: 'reenviar', lead_id: id } })
      if (error) {
        const { mensagem } = await lerErroFuncao(error, 'Não foi possível reenviar agora. Tente de novo.')
        await recarregar()
        return { erro: mensagem }
      }
      await recarregar()
      return { erro: null }
    },
    [recarregar],
  )

  return { leads: itens, carregando, erroCarga, mudarStatus, reenviar }
}

const carregarAssinantes = async () => {
  const [perfis, assinaturas] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('subscriptions').select('*'),
  ])
  if (perfis.error || assinaturas.error || !perfis.data || !assinaturas.data) {
    return { data: null, error: perfis.error ?? assinaturas.error ?? new Error('sem dados') }
  }
  const porUsuario = new Map(assinaturas.data.map((a) => [a.user_id, a]))
  const data: AssinanteAdmin[] = perfis.data.map((p) => ({ ...p, assinatura: porUsuario.get(p.id) ?? null }))
  return { data, error: null }
}

export function useAssinantesAdmin() {
  const { itens, carregando, erroCarga } = useLista<AssinanteAdmin>(carregarAssinantes)
  return { assinantes: itens, carregando, erroCarga }
}

const carregarPlanos = () => supabase.from('planos').select('*').order('destinos_por_dia')

export function usePlanosAdmin() {
  const { itens, setItens, carregando, erroCarga } = useLista<Plano>(carregarPlanos)

  const salvar = useCallback(
    async (plano: string, limites: Pick<Plano, 'destinos_por_dia' | 'rotas_com_alerta' | 'preco_mensal'>): Promise<Resultado> => {
      const { data, error } = await supabase.from('planos').update(limites).eq('plano', plano).select().maybeSingle()
      if (error || !data) {
        console.error('Erro ao salvar o plano', error)
        return { erro: 'Não foi possível salvar. Confira os números e tente de novo.' }
      }
      setItens((atuais) => atuais.map((p) => (p.plano === plano ? data : p)))
      return { erro: null }
    },
    [setItens],
  )

  return { planos: itens, carregando, erroCarga, salvar }
}

const carregarExecucoes = () =>
  supabase.from('alertas_execucoes').select('*').order('iniciado_em', { ascending: false }).limit(20)

type ResumoVerificacao = { rotas_verificadas: number; buscas: number; alertas_gerados: number; erros: number }

/** Histórico das verificações de alertas e o botão "Verificar agora". */
export function useAlertasAdmin() {
  const { itens, carregando, erroCarga, recarregar } = useLista<ExecucaoAlertas>(carregarExecucoes)

  const verificarAgora = useCallback(async (): Promise<Resultado & { resumo?: ResumoVerificacao }> => {
    const { data, error } = await supabase.functions.invoke<ResumoVerificacao>('buscar-voos', {
      body: { acao: 'verificar_alertas' },
    })
    if (error || !data) {
      const { mensagem } = error
        ? await lerErroFuncao(error, 'Não foi possível verificar agora. Tente de novo em instantes.')
        : { mensagem: 'Não foi possível verificar agora. Tente de novo em instantes.' }
      return { erro: mensagem }
    }
    await recarregar()
    return { erro: null, resumo: data }
  }, [recarregar])

  return { execucoes: itens, carregando, erroCarga, verificarAgora }
}
