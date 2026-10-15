import type { FormEvent, ReactNode } from 'react'

type Props = {
  titulo: string
  subtitulo?: ReactNode
  onSubmit: (evento: FormEvent<HTMLFormElement>) => void
  erro?: string | null
  children: ReactNode
  rodape?: ReactNode
}

/** Moldura comum das telas de entrar e de cadastro. */
export function FormularioAuth({ titulo, subtitulo, onSubmit, erro, children, rodape }: Props) {
  return (
    <div className="mx-auto w-full max-w-sm">
      <h1 className="font-display text-2xl font-medium">{titulo}</h1>
      {subtitulo && <p className="mt-1 text-sm text-texto-secundario">{subtitulo}</p>}

      <form
        onSubmit={onSubmit}
        noValidate
        className="mt-6 flex flex-col gap-4 rounded-md border border-fio bg-superficie p-5"
      >
        {children}
        {erro && (
          <p role="alert" className="text-sm font-normal text-texto">
            {erro}
          </p>
        )}
      </form>

      {rodape && <p className="mt-4 text-sm text-texto-secundario">{rodape}</p>}
    </div>
  )
}
