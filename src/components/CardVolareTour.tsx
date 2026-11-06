import type { CardVolareTour as DadosCard } from '@/data/volareTour'

/** Card do bloco "Da Volare Tour para você": foto, selo, título, texto e link para o site da Volare Tour. */
export function CardVolareTour({ card }: { card: DadosCard }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-vm-md bg-vm-surface-card">
      <img src={card.foto} alt={card.alt} loading="lazy" className="h-[180px] w-full object-cover" />
      <div className="flex flex-1 flex-col gap-1.5 px-6 pb-6 pt-5">
        <p className="text-label text-vm-gold-700">{card.selo}</p>
        <h3 className="text-title">{card.titulo}</h3>
        <p className="text-sm text-vm-ink-muted">{card.texto}</p>
        {card.url ? (
          <a
            href={card.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex min-h-11 items-center self-start text-sm font-medium text-vm-gold-700 underline underline-offset-[3px] hover:text-vm-navy-700"
          >
            {card.rotuloLink}
            <span className="sr-only"> (abre o site da Volare Tour em outra aba)</span>
          </a>
        ) : (
          // Sem endereço definido ainda: o texto aparece, mas não leva a lugar nenhum.
          <p className="mt-1 flex min-h-11 items-center text-sm font-medium text-vm-gold-700">{card.rotuloLink}</p>
        )}
      </div>
    </article>
  )
}
