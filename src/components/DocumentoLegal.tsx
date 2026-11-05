import type { ReactNode } from 'react'

import { dataDosTextos } from '@/lib/empresa'

type Secao = { titulo: string; conteudo: ReactNode }

/** Moldura dos textos legais: título, data da revisão e seções numeradas. */
export function DocumentoLegal({ titulo, introducao, secoes }: { titulo: string; introducao: ReactNode; secoes: Secao[] }) {
  return (
    <article className="mx-auto w-full max-w-2xl">
      <h1 className="text-2xl font-medium">{titulo}</h1>
      <p className="mt-1 text-sm text-vm-ink-muted">Atualizado em {dataDosTextos}.</p>
      <div className="mt-4 text-vm-ink-muted">{introducao}</div>
      <div className="mt-6 flex flex-col gap-6">
        {secoes.map((s, i) => (
          <section key={s.titulo} aria-labelledby={`secao-${i + 1}`}>
            <h2 id={`secao-${i + 1}`} className="font-normal text-vm-navy-700">
              {i + 1}. {s.titulo}
            </h2>
            <div className="mt-2 flex flex-col gap-2 text-sm leading-relaxed text-vm-ink-muted">{s.conteudo}</div>
          </section>
        ))}
      </div>
    </article>
  )
}
