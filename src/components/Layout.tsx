import { Outlet } from 'react-router'

import { useAlertas } from '@/contexts/useAlertas'
import { useAuth } from '@/contexts/useAuth'
import { BarraSuperior } from './BarraSuperior'
import { Rodape } from './Rodape'

type Props = {
  /**
   * true: a página ocupa a largura toda e monta os próprios containers (home, resultados, rotas).
   * false: conteúdo dentro do container padrão de 1200px (conta, entrar, termos…).
   */
  larguraTotal?: boolean
}

export function Layout({ larguraTotal = false }: Props) {
  const { naoVistos } = useAlertas()
  const { perfil } = useAuth()

  return (
    <div className="flex min-h-dvh flex-col">
      <BarraSuperior alertasNaoLidos={naoVistos} admin={perfil?.papel === 'admin'} />
      <main className={larguraTotal ? 'flex-1' : 'container flex-1 py-6 md:py-10'}>
        <Outlet />
      </main>
      <Rodape />
    </div>
  )
}
