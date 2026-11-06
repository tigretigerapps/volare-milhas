import { useCallback, useState } from 'react'

import { useAuth } from '@/contexts/useAuth'
import { milheiroExemplo } from '@/data/exemplo'

const chave = 'vm-milheiro'

function lerLocal(): number {
  try {
    const valor = Number(sessionStorage.getItem(chave))
    return valor > 0 ? valor : milheiroExemplo
  } catch {
    return milheiroExemplo
  }
}

/**
 * Milheiro do usuário. Com conta, vem do perfil e é salvo nele.
 * Sem conta, vale só nesta aba (home e resultados compartilham o valor).
 */
export function useMilheiro() {
  const { user, perfil, atualizarPerfil } = useAuth()
  const [local, setLocal] = useState(lerLocal)
  const milheiro = (user && perfil?.custo_milheiro) || local

  const alterar = useCallback(
    async (valor: number): Promise<string | null> => {
      if (!user) {
        setLocal(valor)
        try {
          sessionStorage.setItem(chave, String(valor))
        } catch {
          // Sem armazenamento: o valor vale até recarregar a página.
        }
        return null
      }
      const { erro } = await atualizarPerfil({ custo_milheiro: valor })
      return erro
    },
    [user, atualizarPerfil],
  )

  return { milheiro, alterar }
}
