import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { hojeISO } from '@/lib/datas'

export type ParametrosBusca = {
  origem: string
  destino: string
  ida: string
  volta: string
}

type Props = {
  inicial: ParametrosBusca
  onBuscar: (parametros: ParametrosBusca) => void
  /** Enquanto a busca está em andamento, o botão fica desligado. */
  buscando?: boolean
}

const somenteLetras = (valor: string) => valor.replace(/[^a-z]/gi, '').toUpperCase().slice(0, 3)

export function BarraBusca({ inicial, onBuscar, buscando = false }: Props) {
  const [parametros, setParametros] = useState(inicial)
  // "Volta" mostra o placeholder "Só ida" até o usuário escolher uma data.
  const [voltaComoData, setVoltaComoData] = useState(Boolean(inicial.volta))

  const atualizar = (campo: keyof ParametrosBusca, valor: string) =>
    setParametros((atual) => ({ ...atual, [campo]: valor }))

  const enviar = (evento: FormEvent) => {
    evento.preventDefault()
    onBuscar(parametros)
  }

  return (
    <form
      onSubmit={enviar}
      className="grid grid-cols-2 gap-3 rounded-md border border-fio bg-superficie p-4 md:grid-cols-[repeat(2,minmax(0,6.5rem))_repeat(2,minmax(0,1fr))_auto] md:items-end"
      aria-label="Buscar voos"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="busca-origem">De</Label>
        <Input
          id="busca-origem"
          value={parametros.origem}
          onChange={(e) => atualizar('origem', somenteLetras(e.target.value))}
          placeholder="GRU"
          autoComplete="off"
          className="font-display text-lg font-light tracking-wide"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="busca-destino">Para</Label>
        <Input
          id="busca-destino"
          value={parametros.destino}
          onChange={(e) => atualizar('destino', somenteLetras(e.target.value))}
          placeholder="SSA"
          autoComplete="off"
          className="font-display text-lg font-light tracking-wide"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="busca-ida">Ida</Label>
        <Input
          id="busca-ida"
          type="date"
          min={hojeISO()}
          value={parametros.ida}
          onChange={(e) => atualizar('ida', e.target.value)}
          className="tabular-nums"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="busca-volta">Volta</Label>
        <Input
          id="busca-volta"
          type={voltaComoData ? 'date' : 'text'}
          value={parametros.volta}
          min={parametros.ida}
          placeholder="Só ida"
          onFocus={(e) => {
            if (voltaComoData) return
            setVoltaComoData(true)
            const campo = e.currentTarget
            requestAnimationFrame(() => {
              try {
                campo.showPicker()
              } catch {
                // Navegadores sem showPicker abrem o seletor no próximo clique.
              }
            })
          }}
          onBlur={() => {
            if (!parametros.volta) setVoltaComoData(false)
          }}
          onChange={(e) => atualizar('volta', e.target.value)}
          className="tabular-nums"
        />
      </div>

      <Button type="submit" className="col-span-2 md:col-span-1" disabled={buscando}>
        {buscando ? 'Buscando…' : 'Buscar'}
      </Button>
    </form>
  )
}
