import { useId, useState, type KeyboardEvent } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { descreverAeroporto, filtrarAeroportos, type Aeroporto } from '@/lib/aeroportos'
import { cn } from '@/lib/utils'

type Props = {
  id: string
  rotulo: string
  /** Código de 3 letras (aeroporto ou cidade). */
  valor: string
  onChange: (codigo: string) => void
  placeholder?: string
  required?: boolean
  /** Do lado em que a lista abre; use "direita" para campos perto da borda direita da tela. */
  alinhar?: 'esquerda' | 'direita'
  'aria-invalid'?: boolean
  'aria-describedby'?: string
}

const letrasAteTres = /^[a-z]{0,3}$/i

/**
 * Campo de origem/destino: aceita o código (GRU) ou a busca por cidade/nome (Salvador),
 * mostra a lista de aeroportos para escolher e o nome do aeroporto selecionado.
 */
export function CampoAeroporto({
  id,
  rotulo,
  valor,
  onChange,
  placeholder,
  required,
  alinhar = 'esquerda',
  ...aria
}: Props) {
  const idLista = useId()
  const [digitando, setDigitando] = useState<string | null>(null)
  const [aberto, setAberto] = useState(false)
  const [ativo, setAtivo] = useState(0)

  const texto = digitando ?? valor
  const opcoes = aberto ? filtrarAeroportos(digitando ?? '') : []
  const descricao = descreverAeroporto(valor)

  const escolher = (aeroporto: Aeroporto) => {
    onChange(aeroporto.codigo)
    setDigitando(null)
    setAberto(false)
  }

  const digitar = (novo: string) => {
    setDigitando(novo)
    setAberto(true)
    setAtivo(0)
    // Até 3 letras vale como código (mantém o que a pessoa já sabe digitar); mais que isso é uma busca por nome.
    onChange(letrasAteTres.test(novo) ? novo.toUpperCase() : '')
  }

  const teclas = (evento: KeyboardEvent<HTMLInputElement>) => {
    if (evento.key === 'ArrowDown') {
      evento.preventDefault()
      setAberto(true)
      setAtivo((i) => Math.min(i + 1, Math.max(opcoes.length - 1, 0)))
    } else if (evento.key === 'ArrowUp') {
      evento.preventDefault()
      setAtivo((i) => Math.max(i - 1, 0))
    } else if (evento.key === 'Enter' && aberto && opcoes[ativo] && digitando !== null) {
      evento.preventDefault()
      escolher(opcoes[ativo])
    } else if (evento.key === 'Escape') {
      setAberto(false)
    }
  }

  return (
    <div className="relative flex flex-col gap-1.5">
      <Label htmlFor={id}>{rotulo}</Label>
      <Input
        id={id}
        role="combobox"
        aria-expanded={aberto}
        aria-controls={idLista}
        aria-autocomplete="list"
        aria-activedescendant={aberto && opcoes[ativo] ? `${idLista}-${opcoes[ativo].codigo}` : undefined}
        value={texto}
        onChange={(e) => digitar(e.target.value)}
        onFocus={(e) => {
          // Seleciona o código atual para que digitar já o substitua.
          e.currentTarget.select()
          setAberto(true)
        }}
        onBlur={() => {
          setAberto(false)
          setDigitando(null)
        }}
        onKeyDown={teclas}
        placeholder={placeholder}
        autoComplete="off"
        required={required}
        className="font-display text-lg font-light tracking-wide"
        {...aria}
      />
      {descricao ? (
        <p className="text-xs text-texto-secundario">{descricao}</p>
      ) : (
        <p className="text-xs text-texto-secundario">Código ou nome da cidade</p>
      )}

      {aberto && (
        <ul
          id={idLista}
          role="listbox"
          aria-label={`Aeroportos para ${rotulo.toLowerCase()}`}
          className={cn(
            'absolute top-[4.5rem] z-20 max-h-64 w-72 max-w-[calc(100vw-2rem)] overflow-auto rounded-md border border-fio bg-superficie py-1',
            alinhar === 'direita' ? 'right-0' : 'left-0',
          )}
        >
          {opcoes.length === 0 && <li className="px-3 py-2 text-sm text-texto-secundario">Nenhum aeroporto encontrado.</li>}
          {opcoes.map((aeroporto, indice) => (
            <li
              key={aeroporto.codigo}
              id={`${idLista}-${aeroporto.codigo}`}
              role="option"
              aria-selected={indice === ativo}
              // mouseDown (e não click) para escolher antes de o campo perder o foco.
              onMouseDown={(e) => {
                e.preventDefault()
                escolher(aeroporto)
              }}
              onMouseEnter={() => setAtivo(indice)}
              className={cn('flex cursor-pointer gap-3 px-3 py-2 text-sm', indice === ativo && 'bg-fundo')}
            >
              <span className="w-9 shrink-0 font-display font-medium tabular-nums">{aeroporto.codigo}</span>
              <span className="min-w-0">
                <span className="block text-texto">{aeroporto.cidade}</span>
                <span className="block text-xs text-texto-secundario">
                  {aeroporto.nome} · {aeroporto.pais}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
