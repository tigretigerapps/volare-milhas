import { useEffect, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { ptBR } from 'react-day-picker/locale'
import { CalendarDays } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { hojeISO } from '@/lib/datas'
import { cn } from '@/lib/utils'

export type FaseCalendario = 'ida' | 'volta'

type Props = {
  ida: string
  volta: string
  onChange: (datas: { ida: string; volta: string }) => void
  /** Qual data o calendário está escolhendo; null quando fechado. */
  fase: FaseCalendario | null
  onFase: (fase: FaseCalendario | null) => void
  compacto?: boolean
}

/** "2027-01-20" → Date local (meia-noite), sem passar por UTC. */
function paraData(iso: string): Date | undefined {
  if (!iso) return undefined
  const [ano, mes, dia] = iso.split('-').map(Number)
  return new Date(ano, mes - 1, dia)
}

const formatoCampo = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })

/** "qua, 20 jan" — o dia da semana ajuda a escolher a viagem. */
function textoDoCampo(iso: string): string {
  const data = paraData(iso)
  if (!data) return ''
  return formatoCampo
    .formatToParts(data)
    .filter((p) => p.type !== 'literal')
    .map((p) => p.value.replace('.', ''))
    .join(' ')
    .replace(/^(\S+) /, '$1, ')
}

function somarDias(data: Date, dias: number) {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate() + dias)
}

/** Dois meses lado a lado a partir de 769px; um mês no celular. */
function useDoisMeses() {
  const consulta = '(min-width: 769px)'
  const [dois, setDois] = useState(() => typeof window !== 'undefined' && window.matchMedia?.(consulta).matches)
  useEffect(() => {
    const mq = window.matchMedia?.(consulta)
    if (!mq) return
    const mudar = () => setDois(mq.matches)
    mq.addEventListener('change', mudar)
    return () => mq.removeEventListener('change', mudar)
  }, [])
  return Boolean(dois)
}

/**
 * Ida e volta num calendário só: o primeiro toque marca a ida, o segundo marca a volta.
 * "Só ida" limpa a volta e fecha.
 */
export function CampoDatas({ ida, volta, onChange, fase, onFase, compacto = false }: Props) {
  const doisMeses = useDoisMeses()
  const [passando, setPassando] = useState<Date | undefined>()

  const hoje = paraData(hojeISO())!
  const dataIda = paraData(ida)
  const dataVolta = paraData(volta)

  const escolher = (dia: Date) => {
    const iso = hojeISO(dia)
    if (fase === 'volta' && dataIda && dia >= dataIda) {
      onChange({ ida, volta: iso })
      onFase(null)
      return
    }
    // Fase da ida, ou volta antes da ida: o toque vira a nova ida.
    const manterVolta = dataVolta && dia < dataVolta ? volta : ''
    onChange({ ida: iso, volta: manterVolta })
    onFase('volta')
  }

  const previa =
    fase === 'volta' && dataIda && passando && passando > dataIda && !dataVolta
      ? { from: somarDias(dataIda, 1), to: passando }
      : undefined

  const classeGatilho = cn(
    'flex w-full min-w-0 items-center gap-2 rounded-vm-sm border border-vm-border-control bg-vm-surface-card text-left text-vm-navy-700 vm-num focus-visible:border-vm-navy-700 focus-visible:shadow-[0_0_0_1px_var(--vm-navy-700)] focus-visible:outline-none',
    compacto ? 'h-11 px-3.5 text-[15px]' : 'h-12 px-4 text-base',
  )
  const ativo = (qual: FaseCalendario) => fase === qual && 'border-vm-navy-700 shadow-[0_0_0_1px_var(--vm-navy-700)]'
  const gapCampo = compacto ? 'gap-1.5' : 'gap-2'

  const gatilho = (qual: FaseCalendario, valor: string, vazio: string) => (
    <button
      type="button"
      id={`busca-${qual}`}
      aria-haspopup="dialog"
      aria-expanded={fase === qual}
      onClick={() => onFase(fase === qual ? null : qual)}
      className={cn(classeGatilho, ativo(qual))}
    >
      <span className={cn('min-w-0 flex-1 truncate', !valor && 'text-vm-ink-muted')}>
        {valor ? textoDoCampo(valor) : vazio}
      </span>
      <CalendarDays className="h-5 w-5 flex-none text-vm-ink-muted" strokeWidth={1.5} aria-hidden />
    </button>
  )

  return (
    <Popover open={fase !== null} onOpenChange={(aberto) => !aberto && onFase(null)}>
      <PopoverAnchor asChild>
        <div className={cn('flex min-w-0 flex-col', gapCampo)}>
          <Label htmlFor="busca-ida">Ida</Label>
          {gatilho('ida', ida, 'Escolha a data')}
        </div>
      </PopoverAnchor>

      <div className={cn('flex min-w-0 flex-col', gapCampo)}>
        <Label htmlFor="busca-volta">Volta</Label>
        {gatilho('volta', volta, 'Só ida')}
      </div>

      <PopoverContent
        aria-label={fase === 'volta' ? 'Escolha a data de volta' : 'Escolha a data de ida'}
        className="w-[min(calc(100vw-32px),360px)] p-4 md:w-auto md:p-6"
        onInteractOutside={(e) => {
          // Tocar no outro campo de data troca a fase sem fechar e reabrir.
          const alvo = e.target as HTMLElement | null
          if (alvo?.closest('#busca-ida, #busca-volta')) e.preventDefault()
        }}
      >
        <p className="mb-3 text-body-sm text-vm-ink-muted" aria-live="polite">
          {fase === 'volta' ? (
            <>
              <span className="font-semibold text-vm-navy-700">Agora a volta.</span> Ou marque só ida.
            </>
          ) : (
            <span className="font-semibold text-vm-navy-700">Escolha a data de ida.</span>
          )}
        </p>

        <DayPicker
          locale={ptBR}
          numberOfMonths={doisMeses ? 2 : 1}
          defaultMonth={dataIda ?? hoje}
          startMonth={hoje}
          disabled={{ before: hoje }}
          showOutsideDays={false}
          onDayClick={escolher}
          onDayMouseEnter={setPassando}
          onDayMouseLeave={() => setPassando(undefined)}
          modifiers={{
            ida: dataIda ?? [],
            volta: dataVolta ?? [],
            meio: dataIda && dataVolta ? { after: dataIda, before: dataVolta } : [],
            comFaixa: dataIda && (dataVolta || previa) ? dataIda : [],
            previa: previa ?? [],
          }}
          modifiersClassNames={{
            ida: '[&>button]:!bg-vm-navy-700 [&>button]:!text-white',
            volta:
              'bg-[linear-gradient(to_left,transparent_50%,var(--vm-surface-page)_50%)] [&>button]:!bg-vm-navy-700 [&>button]:!text-white',
            comFaixa: 'bg-[linear-gradient(to_right,transparent_50%,var(--vm-surface-page)_50%)]',
            meio: 'bg-vm-surface-page',
            previa: 'bg-vm-surface-page',
          }}
          classNames={{
            root: 'relative',
            months: 'flex flex-col gap-6 md:flex-row md:gap-8',
            month: 'flex flex-col gap-2',
            month_caption: 'flex h-11 items-center justify-center',
            caption_label: 'text-base font-semibold capitalize',
            nav: 'pointer-events-none absolute inset-x-0 top-0 z-10 flex h-11 items-center justify-between',
            button_previous:
              'pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full text-vm-navy-700 hover:bg-vm-surface-page focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vm-navy-700 disabled:opacity-30',
            button_next:
              'pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full text-vm-navy-700 hover:bg-vm-surface-page focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vm-navy-700 disabled:opacity-30',
            chevron: 'h-5 w-5 fill-current',
            month_grid: 'border-collapse',
            weekdays: '',
            weekday: 'h-8 w-11 text-[12px] font-medium uppercase text-vm-ink-muted',
            week: '',
            day: 'p-0 text-center',
            day_button:
              'h-11 w-11 rounded-full text-[15px] vm-num transition-colors hover:bg-vm-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vm-navy-700 disabled:cursor-not-allowed disabled:hover:bg-transparent',
            today: '[&>button]:font-semibold [&>button]:text-vm-gold-700 [&>button]:underline [&>button]:underline-offset-4',
            disabled: '[&>button]:opacity-30',
            outside: 'invisible',
            hidden: 'invisible',
          }}
        />

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-vm-line pt-4">
          <Button
            type="button"
            variant="link"
            className="min-h-11 px-0"
            onClick={() => {
              onChange({ ida, volta: '' })
              onFase(null)
            }}
          >
            Só ida
          </Button>
          <Button type="button" size="default" onClick={() => onFase(null)}>
            Pronto
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
