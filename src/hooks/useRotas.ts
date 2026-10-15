import { useCallback, useEffect, useState } from 'react'

import { useAuth } from '@/contexts/useAuth'
import { supabase } from '@/integrations/supabase/client'
import type { DadosRota, Rota } from '@/lib/rotas'

type Resultado = { erro: string | null }

const erroGenerico = 'Não foi possível salvar agora. Tente de novo.'

/** Rotas monitoradas do usuário logado. As políticas do banco já limitam às rotas dele. */
export function useRotas() {
  const { user } = useAuth()
  const userId = user?.id
  const [rotas, setRotas] = useState<Rota[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erroCarga, setErroCarga] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    let cancelado = false
    supabase
      .from('rotas_salvas')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelado) return
        if (error) {
          console.error('Erro ao carregar rotas', error)
          setErroCarga('Não foi possível carregar suas rotas. Recarregue a página.')
        } else {
          setRotas(data)
          setErroCarga(null)
        }
        setCarregando(false)
      })
    return () => {
      cancelado = true
    }
  }, [userId])

  const criar = useCallback(async (dados: DadosRota): Promise<Resultado> => {
    const { data, error } = await supabase.from('rotas_salvas').insert(dados).select().single()
    if (error) {
      console.error('Erro ao criar rota', error)
      return { erro: erroGenerico }
    }
    setRotas((atuais) => [data, ...atuais])
    return { erro: null }
  }, [])

  const atualizar = useCallback(
    async (id: string, alteracao: Partial<DadosRota> & { ativo?: boolean }): Promise<Resultado> => {
      const { data, error } = await supabase.from('rotas_salvas').update(alteracao).eq('id', id).select().single()
      if (error) {
        console.error('Erro ao atualizar rota', error)
        return { erro: erroGenerico }
      }
      setRotas((atuais) => atuais.map((r) => (r.id === id ? data : r)))
      return { erro: null }
    },
    [],
  )

  const excluir = useCallback(async (id: string): Promise<Resultado> => {
    const { error } = await supabase.from('rotas_salvas').delete().eq('id', id)
    if (error) {
      console.error('Erro ao excluir rota', error)
      return { erro: 'Não foi possível excluir agora. Tente de novo.' }
    }
    setRotas((atuais) => atuais.filter((r) => r.id !== id))
    return { erro: null }
  }, [])

  return { rotas, carregando, erroCarga, criar, atualizar, excluir }
}
