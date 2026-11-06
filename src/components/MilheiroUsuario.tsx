import { useState, type ReactNode, type SyntheticEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatarReaisComCentavos } from '@/lib/formato'
import { interpretarMilheiro, milheiroParaCampo } from '@/lib/milheiro'

type Props = {
  valor: number
  onAlterar: (valor: number) => Promise<string | null>
  /** Texto antes do valor. Padrão: "Seu milheiro: ". */
  prefixo?: ReactNode
  /** Rótulo do link de edição. Padrão: "Editar". */
  rotuloEditar?: string
  /** Texto depois do link (ex.: companhias consultadas). */
  depois?: ReactNode
  /** Põe um ponto depois do valor ("…de R$ 20,00. Editar milheiro"). */
  pontoFinal?: boolean
}

/** "Seu milheiro: R$ 20,00 Editar", com edição em linha. */
export function MilheiroUsuario({ valor, onAlterar, prefixo = 'Seu milheiro: ', rotuloEditar = 'Editar', depois, pontoFinal = false }: Props) {
  const [editando, setEditando] = useState(false)
  const [rascunho, setRascunho] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const abrir = () => {
    setRascunho(milheiroParaCampo(valor))
    setErro(null)
    setEditando(true)
  }

  const salvar = async (evento: SyntheticEvent) => {
    evento.preventDefault()
    evento.stopPropagation()
    const numero = interpretarMilheiro(rascunho)
    if (numero === null) {
      setErro('Use um valor como 20,00.')
      return
    }
    setSalvando(true)
    const falha = await onAlterar(numero)
    setSalvando(false)
    if (falha) {
      setErro(falha)
      return
    }
    setEditando(false)
  }

  if (editando) {
    return (
      // Não é um <form>: o milheiro pode estar dentro do formulário de busca.
      <div
        role="group"
        aria-label="Editar milheiro"
        className="flex flex-wrap items-center gap-2 text-sm"
        onKeyDown={(e) => {
          if (e.key === 'Enter') void salvar(e)
          if (e.key === 'Escape') setEditando(false)
        }}
      >
        <label htmlFor="milheiro" className="text-vm-ink-muted">
          Seu milheiro: R$
        </label>
        <Input
          id="milheiro"
          inputMode="decimal"
          value={rascunho}
          onChange={(e) => setRascunho(e.target.value)}
          className="h-11 w-24 vm-num"
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro ? 'milheiro-erro' : undefined}
          autoFocus
        />
        <Button type="button" size="sm" className="h-11" disabled={salvando} onClick={(e) => void salvar(e)}>
          {salvando ? 'Salvando…' : 'Salvar'}
        </Button>
        <Button type="button" variant="link" className="min-h-11" onClick={() => setEditando(false)}>
          Cancelar
        </Button>
        {erro && (
          <p id="milheiro-erro" role="alert" className="basis-full text-[13px] text-vm-burgundy-600">
            {erro}
          </p>
        )}
      </div>
    )
  }

  return (
    <p className="text-sm text-vm-ink-muted">
      {prefixo}
      <strong className="font-semibold text-vm-navy-700 vm-num">{formatarReaisComCentavos(valor)}</strong>
      {pontoFinal ? '. ' : ' '}
      <Button type="button" variant="link" className="min-h-11 align-baseline md:min-h-0" onClick={abrir}>
        {rotuloEditar}
      </Button>
      {depois && <> {depois}</>}
    </p>
  )
}
