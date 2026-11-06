import { useId, useState, type FormEvent, type ReactNode } from 'react'

import { CampoAeroporto } from '@/components/CampoAeroporto'
import { CampoDatas, type FaseCalendario } from '@/components/CampoDatas'
import { Button } from '@/components/ui/button'
import { dataPorExtenso } from '@/lib/datas'
import { cn } from '@/lib/utils'

export type ParametrosBusca = {
  origem: string
  destino: string
  ida: string
  volta: string
}

type Props = {
  inicial: ParametrosBusca
  onBuscar: (parametros: ParametrosBusca) => void
  /** Enquanto a busca está em andamento, o botão fica desligado e mostra "Buscando…". */
  buscando?: boolean
  /**
   * normal: bloco branco (home), com a linha do milheiro embaixo.
   * compacto: barra branca de ponta a ponta (resultados); no celular vira um resumo com "Alterar".
   */
  variante?: 'normal' | 'compacto'
  /** Linha abaixo dos campos, só na variante normal (milheiro e companhias consultadas). */
  rodape?: ReactNode
}

/** "15 de dezembro, só ida, 1 adulto". */
function resumoDaBusca(p: ParametrosBusca): string {
  if (!p.ida) return 'Escolha a data da viagem'
  const volta = p.volta ? `volta em ${dataPorExtenso(p.volta)}` : 'só ida'
  return `${dataPorExtenso(p.ida)}, ${volta}, 1 adulto`
}

export function BarraBusca({ inicial, onBuscar, buscando = false, variante = 'normal', rodape }: Props) {
  const compacto = variante === 'compacto'
  const idFormulario = useId()
  const [parametros, setParametros] = useState(inicial)
  const [faseCalendario, setFaseCalendario] = useState<FaseCalendario | null>(null)
  // Celular, variante compacta: o formulário fica recolhido atrás do resumo até tocar em "Alterar".
  const [aberto, setAberto] = useState(false)

  const atualizar = (campo: keyof ParametrosBusca, valor: string) =>
    setParametros((atual) => ({ ...atual, [campo]: valor }))

  const enviar = (evento: FormEvent) => {
    evento.preventDefault()
    // Sem data de ida não há busca: o calendário abre para escolher.
    if (!parametros.ida) {
      setFaseCalendario('ida')
      return
    }
    setAberto(false)
    onBuscar(parametros)
  }

  const gapCampo = compacto ? 'gap-1.5' : 'gap-2'

  const campos = (
    <>
      <CampoAeroporto
        id="busca-origem"
        rotulo="De"
        valor={parametros.origem}
        onChange={(codigo) => atualizar('origem', codigo)}
        placeholder="GRU"
        compacto={compacto}
        required
      />

      <CampoAeroporto
        id="busca-destino"
        rotulo="Para"
        valor={parametros.destino}
        onChange={(codigo) => atualizar('destino', codigo)}
        placeholder="SSA"
        alinhar="direita"
        compacto={compacto}
        required
      />

      <CampoDatas
        ida={parametros.ida}
        volta={parametros.volta}
        onChange={(datas) => setParametros((atual) => ({ ...atual, ...datas }))}
        fase={faseCalendario}
        onFase={setFaseCalendario}
        compacto={compacto}
      />

      {/* No desktop o botão desce até a linha dos campos: um rótulo vazio ocupa o lugar do rótulo dos outros. */}
      <div className={cn('col-span-2 flex flex-col md:col-span-1', gapCampo)}>
        <span aria-hidden className="hidden text-label md:block">
          &nbsp;
        </span>
        <Button
          type="submit"
          variant={compacto ? 'contorno' : 'default'}
          size={compacto ? 'default' : 'lg'}
          className={cn('w-full', compacto && 'px-6 text-[15px] font-semibold')}
          disabled={buscando}
          aria-busy={buscando || undefined}
        >
          {buscando ? 'Buscando…' : compacto ? 'Buscar de novo' : 'Buscar'}
        </Button>
      </div>
    </>
  )

  if (!compacto) {
    return (
      <form
        onSubmit={enviar}
        aria-label="Buscar voos"
        className="flex flex-col gap-4 rounded-vm-md bg-vm-surface-card p-4 md:p-6"
      >
        <div className="grid grid-cols-2 items-start gap-3 md:grid-cols-[repeat(auto-fit,minmax(170px,1fr))]">{campos}</div>
        {rodape && <div className="text-body-sm text-vm-ink-muted">{rodape}</div>}
      </form>
    )
  }

  return (
    <div className="border-b border-vm-line bg-vm-surface-card">
      <div className={cn('flex items-center justify-between gap-3 px-4 py-3.5 md:hidden', aberto && 'hidden')}>
        <div className="min-w-0">
          <p className="text-lg font-semibold">
            {inicial.origem} para {inicial.destino}
          </p>
          <p className="mt-0.5 text-[13px] text-vm-ink-muted">{resumoDaBusca(inicial)}</p>
        </div>
        <Button
          variant="contorno"
          size="default"
          className="px-3.5"
          aria-expanded={aberto}
          aria-controls={idFormulario}
          onClick={() => setAberto(true)}
        >
          Alterar
        </Button>
      </div>
      <form
        id={idFormulario}
        onSubmit={enviar}
        aria-label="Buscar voos"
        className={cn(
          'mx-auto max-w-[1200px] grid-cols-2 items-start gap-3 px-4 py-4 md:grid md:grid-cols-[repeat(auto-fit,minmax(150px,1fr))] md:px-6',
          aberto ? 'grid' : 'hidden',
        )}
      >
        {campos}
      </form>
    </div>
  )
}
