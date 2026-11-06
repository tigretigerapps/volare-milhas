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
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-vm-sm bg-vm-surface-card px-4 py-3 font-semibold text-vm-navy-700 focus:not-sr-only focus:fixed focus:px-4 focus:py-3 focus:left-3 focus:top-3 focus:outline-none focus:ring-2 focus:ring-vm-navy-700"
      >
        Pular para o conteúdo
      </a>
      <BarraSuperior alertasNaoLidos={naoVistos} admin={perfil?.papel === 'admin'} />
      <main id="conteudo" tabIndex={-1} className={larguraTotal ? 'flex-1 outline-none' : 'container flex-1 py-6 outline-none md:py-10'}>
        <Outlet />
      </main>
      <Rodape />
    </div>
  )
}
