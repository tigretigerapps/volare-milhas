import { Link } from 'react-router'

const classeLink =
  'inline-flex min-h-11 items-center text-[13px] text-white opacity-[.78] underline-offset-[3px] hover:opacity-100 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white'

export function Rodape() {
  return (
    <footer className="bg-vm-navy-900 text-white">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-8 gap-y-4 px-6 py-8">
        <img src="/brand/volo-logo-branco.svg" alt="Volo by Volare" className="h-12 w-auto" />
        <p className="min-w-0 flex-1 basis-64 text-[13px] leading-[18px] opacity-[.78]">
          Uma plataforma da Volare Tour. A emissão das passagens é feita pela equipe da Volare.
        </p>
        <nav aria-label="Informações legais" className="flex gap-6">
          <Link to="/termos" className={classeLink}>
            Termos de uso
          </Link>
          <Link to="/privacidade" className={classeLink}>
            Privacidade
          </Link>
        </nav>
      </div>
    </footer>
  )
}
