import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  companhiasDisponiveis,
  hojeISO,
  validarRota,
  type CampoRota,
  type DadosRota,
  type FormularioRota as Valores,
} from '@/lib/rotas'
import { cn } from '@/lib/utils'

type Props = {
  titulo: string
  inicial: Valores
  onSalvar: (dados: DadosRota) => Promise<{ erro: string | null }>
  onCancelar: () => void
}

const somenteLetras = (valor: string) => valor.replace(/[^a-z]/gi, '').toUpperCase().slice(0, 3)

function Erro({ id, texto }: { id: string; texto?: string }) {
  if (!texto) return null
  return (
    <p id={id} className="text-xs text-texto">
      {texto}
    </p>
  )
}

export function FormularioRota({ titulo, inicial, onSalvar, onCancelar }: Props) {
  const [valores, setValores] = useState(inicial)
  const [erros, setErros] = useState<Partial<Record<CampoRota, string>>>({})
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const hoje = hojeISO()

  const atualizar = <K extends keyof Valores>(campo: K, valor: Valores[K]) =>
    setValores((atuais) => ({ ...atuais, [campo]: valor }))

  const alternarCompanhia = (valor: string) =>
    atualizar(
      'companhias',
      valores.companhias.includes(valor) ? valores.companhias.filter((c) => c !== valor) : [...valores.companhias, valor],
    )

  const salvar = async (evento: FormEvent) => {
    evento.preventDefault()
    const resultado = validarRota(valores, hoje)
    if (!resultado.ok) {
      setErros(resultado.erros)
      return
    }
    setErros({})
    setSalvando(true)
    const { erro } = await onSalvar(resultado.dados)
    setSalvando(false)
    setErroEnvio(erro)
  }

  const invalido = (campo: CampoRota) => (erros[campo] ? { 'aria-invalid': true, 'aria-describedby': `rota-${campo}-erro` } : {})

  return (
    <form
      onSubmit={salvar}
      noValidate
      aria-labelledby="formulario-rota-titulo"
      className="flex flex-col gap-5 rounded-md border border-fio bg-superficie p-5"
    >
      <h2 id="formulario-rota-titulo" className="font-display text-lg font-medium">
        {titulo}
      </h2>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rota-origem">De</Label>
          <Input
            id="rota-origem"
            value={valores.origem}
            onChange={(e) => atualizar('origem', somenteLetras(e.target.value))}
            placeholder="GRU"
            autoComplete="off"
            className="font-display text-lg font-light tracking-wide"
            {...invalido('origem')}
          />
          <Erro id="rota-origem-erro" texto={erros.origem} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rota-destino">Para</Label>
          <Input
            id="rota-destino"
            value={valores.destino}
            onChange={(e) => atualizar('destino', somenteLetras(e.target.value))}
            placeholder="LIS"
            autoComplete="off"
            className="font-display text-lg font-light tracking-wide"
            {...invalido('destino')}
          />
          <Erro id="rota-destino-erro" texto={erros.destino} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rota-dataInicio">Viajar a partir de</Label>
          <Input
            id="rota-dataInicio"
            type="date"
            min={hoje}
            value={valores.dataInicio}
            onChange={(e) => atualizar('dataInicio', e.target.value)}
            className="tabular-nums"
            {...invalido('dataInicio')}
          />
          <Erro id="rota-dataInicio-erro" texto={erros.dataInicio} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rota-dataFim">Até</Label>
          <Input
            id="rota-dataFim"
            type="date"
            min={valores.dataInicio || hoje}
            value={valores.dataFim}
            onChange={(e) => atualizar('dataFim', e.target.value)}
            className="tabular-nums"
            {...invalido('dataFim')}
          />
          <Erro id="rota-dataFim-erro" texto={erros.dataFim} />
        </div>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm text-texto-secundario">Preço-alvo</legend>
        <p className="text-xs text-texto-secundario">
          Preencha um ou os dois. Avisamos quando aparecer uma oferta igual ou abaixo.
        </p>
        <div className="grid grid-cols-2 gap-3 md:max-w-md">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rota-alvoMilhas">Em milhas</Label>
            <Input
              id="rota-alvoMilhas"
              inputMode="numeric"
              placeholder="40.000"
              value={valores.alvoMilhas}
              onChange={(e) => atualizar('alvoMilhas', e.target.value)}
              className="tabular-nums"
              {...invalido('alvoMilhas')}
            />
            <Erro id="rota-alvoMilhas-erro" texto={erros.alvoMilhas} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rota-alvoReais">Em reais</Label>
            <Input
              id="rota-alvoReais"
              inputMode="decimal"
              placeholder="2.500,00"
              value={valores.alvoReais}
              onChange={(e) => atualizar('alvoReais', e.target.value)}
              className="tabular-nums"
              {...invalido('alvoReais')}
            />
            <Erro id="rota-alvoReais-erro" texto={erros.alvoReais} />
          </div>
        </div>
        <Erro id="rota-alvo-erro" texto={erros.alvo} />
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm text-texto-secundario">Companhias</legend>
        <p className="text-xs text-texto-secundario">Sem nenhuma marcada, monitoramos todas.</p>
        <div className="flex flex-wrap gap-2">
          {companhiasDisponiveis.map((c) => {
            const marcada = valores.companhias.includes(c.valor)
            return (
              <label
                key={c.valor}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
                  marcada ? 'border-primario text-texto' : 'border-fio text-texto-secundario hover:border-texto-secundario',
                )}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[rgb(var(--primario))]"
                  checked={marcada}
                  onChange={() => alternarCompanhia(c.valor)}
                />
                {c.rotulo}
              </label>
            )
          })}
        </div>
      </fieldset>

      {erroEnvio && (
        <p role="alert" className="text-sm text-texto">
          {erroEnvio}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar rota'}
        </Button>
        <Button type="button" variant="link" onClick={onCancelar}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
