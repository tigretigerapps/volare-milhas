import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { Menu, User } from 'lucide-react'

import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

type Props = {
  alertasNaoLidos: number
  /** Mostra o link do painel administrativo. */
  admin?: boolean
}

type ItemMenu = { para: string; rotulo: string; comBadge?: boolean }

const links: ItemMenu[] = [
  { para: '/buscar', rotulo: 'Buscar' },
  { para: '/rotas', rotulo: 'Minhas rotas', comBadge: true },
]

const linkAdmin: ItemMenu = { para: '/admin', rotulo: 'Painel' }
const linkConta: ItemMenu = { para: '/conta', rotulo: 'Conta' }

/** "Buscar" fica ativo na home e em toda a área de busca (inclusive /buscar/resultados). */
function estaAtivo(para: string, caminho: string): boolean {
  if (para === '/buscar') return caminho === '/' || caminho === '/buscar' || caminho.startsWith('/buscar/')
  return caminho === para || caminho.startsWith(`${para}/`)
}

function textoAlertas(valor: number) {
  return `${valor} ${valor === 1 ? 'alerta novo' : 'alertas novos'}`
}

function Badge({ valor }: { valor: number }) {
  return (
    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-vm-pill bg-vm-burgundy-600 px-1.5 text-xs font-semibold text-white vm-num">
      <span aria-hidden>{valor}</span>
      <span className="sr-only">, {textoAlertas(valor)}</span>
    </span>
  )
}

const classeLinkDesktop =
  'flex items-center gap-2 border-b-2 pb-[34px] pt-9 text-[15px] font-medium leading-6 text-white transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-vm-navy-900'

export function BarraSuperior({ alertasNaoLidos, admin = false }: Props) {
  const [menuAberto, setMenuAberto] = useState(false)
  const { pathname } = useLocation()
  const itens = admin ? [...links, linkAdmin] : links

  const linkDesktop = (link: ItemMenu) => {
    const ativo = estaAtivo(link.para, pathname)
    return (
      <Link
        to={link.para}
        aria-current={ativo ? 'page' : undefined}
        className={cn(classeLinkDesktop, ativo ? 'border-vm-gold-500 opacity-100' : 'border-transparent opacity-[.78]')}
      >
        {link.rotulo}
        {link.comBadge && alertasNaoLidos > 0 && <Badge valor={alertasNaoLidos} />}
      </Link>
    )
  }

  return (
    <header className="bg-vm-navy-900 text-white">
      {/* Desktop: navegação à esquerda, logo no centro, conta à direita. */}
      <div className="mx-auto hidden h-24 max-w-[1200px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-6 px-6 md:grid">
        <nav aria-label="Principal">
          <ul className="flex items-center gap-8">
            {itens.map((link) => (
              <li key={link.para}>{linkDesktop(link)}</li>
            ))}
          </ul>
        </nav>
        <Link
          to="/"
          className="rounded-vm-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <img src="/brand/volo-logo-branco.svg" alt="Volo by Volare, ir para a home" className="h-14 w-auto" />
        </Link>
        <div className="flex justify-end">{linkDesktop(linkConta)}</div>
      </div>

      {/* Celular: menu à esquerda, logo no centro, ícone de conta à direita. */}
      <div className="grid h-[72px] grid-cols-[44px_1fr_44px] items-center px-3 md:hidden">
        <Sheet open={menuAberto} onOpenChange={setMenuAberto}>
          <SheetTrigger
            className="relative flex h-11 w-11 items-center justify-center rounded-vm-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label={alertasNaoLidos > 0 ? `Abrir menu, ${textoAlertas(alertasNaoLidos)}` : 'Abrir menu'}
          >
            <Menu className="h-6 w-6" strokeWidth={1.5} aria-hidden />
            {alertasNaoLidos > 0 && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-vm-burgundy-600" aria-hidden />
            )}
          </SheetTrigger>
          <SheetContent lado="esquerda">
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription className="sr-only">Navegação principal</SheetDescription>
            <nav aria-label="Principal">
              <ul className="flex flex-col">
                {[...itens, linkConta].map((link) => {
                  const ativo = estaAtivo(link.para, pathname)
                  return (
                    <li key={link.para} className="border-b border-vm-line last:border-b-0">
                      <NavLink
                        to={link.para}
                        onClick={() => setMenuAberto(false)}
                        aria-current={ativo ? 'page' : undefined}
                        className={cn(
                          'flex min-h-11 items-center justify-between py-3 text-base text-vm-ink-muted',
                          ativo && 'font-semibold text-vm-navy-700',
                        )}
                      >
                        {link.rotulo}
                        {link.comBadge && alertasNaoLidos > 0 && <Badge valor={alertasNaoLidos} />}
                      </NavLink>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </SheetContent>
        </Sheet>

        <Link
          to="/"
          className="justify-self-center rounded-vm-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <img src="/brand/volo-logo-branco.svg" alt="Volo by Volare, ir para a home" className="h-[46px] w-auto" />
        </Link>

        <Link
          to="/conta"
          aria-label="Conta"
          aria-current={estaAtivo('/conta', pathname) ? 'page' : undefined}
          className="flex h-11 w-11 items-center justify-center rounded-vm-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <User className="h-6 w-6" strokeWidth={1.5} aria-hidden />
        </Link>
      </div>
    </header>
  )
}
