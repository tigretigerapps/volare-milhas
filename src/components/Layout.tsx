import { Link, Outlet } from 'react-router'

import { useAlertas } from '@/contexts/useAlertas'
import { useAuth } from '@/contexts/useAuth'
import { BarraSuperior } from './BarraSuperior'

export function Layout() {
  const { naoVistos } = useAlertas()
  const { perfil } = useAuth()

  return (
    <div className="min-h-dvh">
      <BarraSuperior alertasNaoLidos={naoVistos} admin={perfil?.papel === 'admin'} />
      <main className="container py-6 md:py-8">
        <Outlet />
      </main>
      <footer className="container border-t border-fio py-6 text-sm text-texto-secundario">
        <nav aria-label="Informações legais" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link to="/termos" className="underline underline-offset-4 decoration-fio hover:text-texto hover:decoration-texto">
            Termos de uso
          </Link>
          <Link to="/privacidade" className="underline underline-offset-4 decoration-fio hover:text-texto hover:decoration-texto">
            Política de privacidade
          </Link>
        </nav>
      </footer>
    </div>
  )
}
