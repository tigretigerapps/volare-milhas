import { useNavigate } from 'react-router'

import { BarraBusca, type ParametrosBusca } from '@/components/BarraBusca'
import { CardVolareTour } from '@/components/CardVolareTour'
import { MilheiroUsuario } from '@/components/MilheiroUsuario'
import { destaque } from '@/data/destaque'
import { cardsVolareTour } from '@/data/volareTour'
import { useMilheiro } from '@/hooks/useMilheiro'
import { hojeISO, somarDiasISO } from '@/lib/datas'
import { urlResultados } from '@/lib/urlBusca'

/** Companhias consultadas em toda busca (mesma lista de companhiasPadrao). */
const fraseCompanhias = 'Buscamos GOL, Azul, LATAM e TAP em cada busca.'

export function Home() {
  const navigate = useNavigate()
  const { milheiro, alterar } = useMilheiro()

  // A data de exemplo do destaque só vale enquanto não passou.
  const hoje = hojeISO()
  const inicial: ParametrosBusca = {
    origem: destaque.busca.origem,
    destino: destaque.busca.destino,
    ida: destaque.busca.ida >= hoje ? destaque.busca.ida : somarDiasISO(hoje, 30),
    volta: '',
  }

  return (
    <>
      <section className="relative h-[560px] overflow-hidden bg-vm-navy-700">
        <picture>
          <source media="(max-width: 768px)" srcSet={destaque.fotoCelular} />
          <img
            src={destaque.fotoDesktop}
            alt={destaque.alt}
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: destaque.posicao }}
          />
        </picture>
        <div className="absolute inset-0 bg-vm-navy-900 opacity-30" aria-hidden />
        <div className="relative mx-auto max-w-[1200px] px-4 pt-10 md:px-6 md:pt-14">
          <div className="max-w-[760px]">
            <p className="mb-3 text-[15px] font-medium text-vm-gold-300">{destaque.rotulo}</p>
            <h1 className="font-display text-[44px] font-normal leading-[48px] text-white md:text-display-xl">
              {destaque.titulo}
            </h1>
            <p className="mt-4 max-w-[520px] text-lg leading-7 text-white opacity-[.88]">{destaque.subtitulo}</p>
          </div>
        </div>
      </section>

      <div className="relative mx-auto -mt-[120px] max-w-[1200px] px-4 md:px-6">
        <BarraBusca
          inicial={inicial}
          onBuscar={(p) => navigate(urlResultados(p))}
          rodape={<MilheiroUsuario valor={milheiro} onAlterar={alterar} depois={fraseCompanhias} />}
        />
      </div>

      <section aria-labelledby="titulo-volare-tour" className="mx-auto max-w-[1200px] px-4 pb-[72px] pt-16 md:px-6">
        <h2 id="titulo-volare-tour" className="text-heading-l">
          Da Volare Tour para você
        </h2>
        <p className="mb-6 mt-2 text-vm-ink-muted">
          Quando a viagem pede mais que a passagem, a equipe da Volare monta o resto.
        </p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
          {cardsVolareTour.map((card) => (
            <CardVolareTour key={card.titulo} card={card} />
          ))}
        </div>
      </section>
    </>
  )
}
