import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { supabase } from '@/integrations/supabase/client'
import { alertaRecente, contarNaoVistos, prepararAlertas, type LinhaAlerta } from '@/lib/alertas'
import { useAuth } from './useAuth'
import { AlertasContext, type ValorAlertas } from './alertas-context'

const chaveVisto = (userId: string) => `volare:alertas-vistos:${userId}`

// O armazenamento pode estar bloqueado (navegação privada, política do navegador): nesse caso
// o badge só some ao recarregar, mas nada quebra.
function lerVisto(userId: string): string | null {
  try {
    return window.localStorage.getItem(chaveVisto(userId))
  } catch {
    return null
  }
}

function gravarVisto(userId: string, instante: string) {
  try {
    window.localStorage.setItem(chaveVisto(userId), instante)
  } catch {
    // ignora
  }
}

export function AlertasProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id
  const [carregados, setCarregados] = useState<{ userId: string; linhas: LinhaAlerta[]; em: number } | null>(null)
  const [visto, setVisto] = useState<{ userId: string; ate: string } | null>(null)

  useEffect(() => {
    if (!userId) return
    let cancelado = false

    const carregar = () => {
      supabase
        .from('alertas_enviados')
        .select('id, enviado_em, oferta_chave, oferta, rotas_salvas(origem, destino, preco_alvo_milhas, preco_alvo_rs)')
        .order('enviado_em', { ascending: false })
        .limit(50)
        .then(({ data, error }) => {
          if (cancelado) return
          if (error) {
            console.error('Erro ao carregar alertas', error)
            return
          }
          setCarregados({ userId, linhas: data, em: Date.now() })
        })
    }

    carregar()
    // Os alertas chegam de fora (um processo que monitora os preços), então atualiza ao voltar para a aba.
    window.addEventListener('focus', carregar)
    return () => {
      cancelado = true
      window.removeEventListener('focus', carregar)
    }
  }, [userId])

  // Ignora o que sobrou de outro usuário (ex.: logo depois de sair).
  const doUsuario = userId && carregados?.userId === userId ? carregados : null
  const linhas = doUsuario?.linhas ?? null
  const carregadoEm = doUsuario?.em ?? null
  const alertas = useMemo(() => prepararAlertas(linhas ?? []), [linhas])

  const vistoAte = userId ? (visto?.userId === userId ? visto.ate : lerVisto(userId)) : null
  const naoVistos = useMemo(() => contarNaoVistos(alertas, vistoAte), [alertas, vistoAte])
  // "Agora" é o momento da última carga: assim o cálculo não depende do relógio a cada renderização.
  const recente = useMemo(
    () => (carregadoEm === null ? null : alertaRecente(alertas, new Date(carregadoEm))),
    [alertas, carregadoEm],
  )

  const maisNovo = alertas[0]?.enviadoEm
  const marcarVistos = useCallback(() => {
    if (!userId || !maisNovo) return
    gravarVisto(userId, maisNovo)
    setVisto({ userId, ate: maisNovo })
  }, [userId, maisNovo])

  const valor = useMemo<ValorAlertas>(
    () => ({ alertas, naoVistos, recente, marcarVistos }),
    [alertas, naoVistos, recente, marcarVistos],
  )

  return <AlertasContext.Provider value={valor}>{children}</AlertasContext.Provider>
}
