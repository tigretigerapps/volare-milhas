import type { ReactNode } from 'react'

import { dataDosTextos } from '@/lib/empresa'

type Secao = { titulo: string; conteudo: ReactNode }

/** Moldura dos textos legais: título, data da revisão e seções numeradas. */
export function DocumentoLegal({ titulo, introducao, secoes }: { titulo: string; introducao: ReactNode; secoes: Secao[] }) {
  return (
    <article className="mx-auto w-full max-w-[720px]">
      <h1 className="text-2xl font-semibold leading-[30px] md:text-heading-l">{titulo}</h1>
      <p className="mt-2 text-vm-ink-muted">Atualizado em {dataDosTextos}.</p>
      <div className="mt-4 text-vm-ink-muted">{introducao}</div>
      <div className="mt-6 flex flex-col gap-6">
        {secoes.map((s, i) => (
          <section key={s.titulo} aria-labelledby={`secao-${i + 1}`}>
            <h2 id={`secao-${i + 1}`} className="text-lg font-semibold leading-6 text-vm-navy-700">
              {i + 1}. {s.titulo}
            </h2>
            <div className="mt-2 flex flex-col gap-2 text-[15px] leading-6 text-vm-ink-muted">{s.conteudo}</div>
          </section>
        ))}
      </div>
    </article>
  )
}
