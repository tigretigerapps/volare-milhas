import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'

import type { Tables, TablesUpdate } from '@/integrations/supabase/types'

export type Perfil = Tables<'profiles'>

/** Só estas colunas podem ser alteradas pelo próprio usuário (grant de coluna no banco). */
export type AlteracaoPerfil = Pick<TablesUpdate<'profiles'>, 'nome' | 'telefone' | 'custo_milheiro'>

export type ValorAuth = {
  /** true até a sessão salva no navegador ser lida. */
  carregando: boolean
  session: Session | null
  user: User | null
  perfil: Perfil | null
  atualizarPerfil: (alteracao: AlteracaoPerfil) => Promise<{ erro: string | null }>
  sair: () => Promise<void>
}

export const AuthContext = createContext<ValorAuth | null>(null)
