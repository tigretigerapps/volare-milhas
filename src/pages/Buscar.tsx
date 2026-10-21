import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'

import { BarraBusca, type ParametrosBusca } from '@/components/BarraBusca'
import { FaixaAlerta } from '@/components/FaixaAlerta'
import { LinhaResultado } from '@/components/LinhaResultado'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAlertas } from '@/contexts/useAlertas'
import { useAuth } from '@/contexts/useAuth'
import { useBuscaVoos } from '@/hooks/useBuscaVoos'
import { useLeads, type EstadoLead } from '@/hooks/useLeads'
import { milheiroExemplo, ofertasExemplo, type Oferta } from '@/data/exemplo'
import { companhiasPadrao, separarPorSentido } from '@/lib/busca'
import { ordenarOfertas, type CriterioOrdenacao } from '@/lib/comparacao'
import { hojeISO, somarDiasISO } from '@/lib/datas'
import { formatarReaisComCentavos } from '@/lib/formato'
import { interpretarMilheiro, milheiroParaCampo } from '@/lib/milheiro'
import { formatarData } from '@/lib/rotas'
import { cn } from '@/lib/utils'

const criterios: { valor: CriterioOrdenacao; rotulo: string }[] = [
  { valor: 'economia', rotulo: 'maior economia' },
  { valor: 'horario', rotulo: 'horário' },
  { valor: 'duracao', rotulo: 'duração' },
]

function MilheiroUsuario({
  valor,
  onAlterar,
}: {
  valor: number
  onAlterar: (valor: number) => Promise<string | null>
}) {
  const [editando, setEditando] = useState(false)
  const [rascunho, setRascunho] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const abrir = () => {
    setRascunho(milheiroParaCampo(valor))
    setErro(null)
    setEditando(true)
  }

  const salvar = async (evento: FormEvent) => {
    evento.preventDefault()
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
      <form onSubmit={salvar} noValidate className="flex flex-wrap items-center gap-2">
        <label htmlFor="milheiro" className="text-texto-secundario">
          Seu milheiro: R$
        </label>
        <Input
          id="milheiro"
          inputMode="decimal"
          value={rascunho}
          onChange={(e) => setRascunho(e.target.value)}
          className="h-9 w-24 tabular-nums"
          aria-invalid={erro ? true : undefined}
          autoFocus
        />
        <Button type="submit" size="sm" disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar'}
        </Button>
        <Button type="button" variant="link" onClick={() => setEditando(false)}>
          Cancelar
        </Button>
        {erro && (
          <p role="alert" className="basis-full text-texto">
            {erro}
          </p>
        )}
      </form>
    )
  }

  return (
    <p className="flex flex-wrap items-baseline gap-x-3">
      <span>
        <span className="text-texto-secundario">Seu milheiro: </span>
        <span className="whitespace-nowrap font-normal tabular-nums">{formatarReaisComCentavos(valor)}</span>
      </span>
      <Button variant="link" onClick={abrir}>
        Editar
      </Button>
    </p>
  )
}

const linkDiscreto = 'text-texto underline underline-offset-4 decoration-fio hover:decoration-texto'

function Aviso({ children, alerta = false }: { children: React.ReactNode; alerta?: boolean }) {
  return (
    <p
      role={alerta ? 'alert' : 'status'}
      className="rounded-md border border-fio bg-superficie p-3 text-sm text-texto-secundario"
    >
      {children}
    </p>
  )
}

function GrupoResultados({
  titulo,
  ofertas,
  milheiro,
  criterio,
  vazio,
  onQuero,
  leads,
}: {
  titulo?: string
  ofertas: Oferta[]
  milheiro: number
  criterio: CriterioOrdenacao
  vazio: string
  onQuero: (oferta: Oferta) => void
  leads: Record<string, EstadoLead>
}) {
  const ordenadas = ordenarOfertas(ofertas, criterio, milheiro)
  return (
    <section aria-label={titulo ?? 'Resultados'}>
      {titulo && <h2 className="mb-2 font-display text-lg font-medium">{titulo}</h2>}
      {ordenadas.length === 0 ? (
        <p className="border-y border-fio py-6 text-sm text-texto-secundario">{vazio}</p>
      ) : (
        <ul className="divide-y divide-fio border-y border-fio">
          {ordenadas.map((oferta) => (
            <LinhaResultado key={oferta.id} oferta={oferta} milheiro={milheiro} onQuero={onQuero} lead={leads[oferta.id]} />
          ))}
        </ul>
      )}
    </section>
  )
}

export function Buscar() {
  const navigate = useNavigate()
  const { user, perfil, atualizarPerfil } = useAuth()
  const { recente: alertaRecente } = useAlertas()
  const { estado, buscar } = useBuscaVoos()
  const { estados: leads, querer } = useLeads()
  // Sem conta, o milheiro vale só nesta tela; com conta, vem do perfil e é salvo nele.
  const [milheiroLocal, setMilheiroLocal] = useState(milheiroExemplo)
  const milheiro = (user && perfil?.custo_milheiro) || milheiroLocal
  const [criterio, setCriterio] = useState<CriterioOrdenacao>('economia')
  const [inicial] = useState<ParametrosBusca>(() => ({
    origem: 'GRU',
    destino: 'SSA',
    ida: somarDiasISO(hojeISO(), 30),
    volta: '',
  }))

  const alterarMilheiro = async (valor: number) => {
    if (!user) {
      setMilheiroLocal(valor)
      return null
    }
    const { erro } = await atualizarPerfil({ custo_milheiro: valor })
    return erro
  }

  const aoBuscar = (parametros: ParametrosBusca) => {
    if (!user) {
      navigate('/entrar', { state: { de: '/buscar' } })
      return
    }
    void buscar({
      origem: parametros.origem,
      destino: parametros.destino,
      dataIda: parametros.ida,
      dataVolta: parametros.volta || null,
      companhias: companhiasPadrao,
    })
  }

  const pronto = estado.tipo === 'pronto' ? estado : null

  const aoQuerer = (oferta: Oferta) => {
    if (!user || !pronto) {
      navigate('/entrar', { state: { de: '/buscar' } })
      return
    }
    void querer(oferta, pronto.pedido)
  }
  const uso = pronto?.uso ?? (estado.tipo === 'erro' ? estado.erro.uso : undefined)
  // Sem conta, a tela mostra os exemplos fixos; com conta, só o que a busca devolveu.
  const ofertas = user ? (pronto?.ofertas ?? []) : ofertasExemplo
  const { ida, volta } = separarPorSentido(ofertas)
  const comVolta = Boolean(pronto?.pedido.dataVolta)

  return (
    <div className="flex flex-col gap-6">
      <h1 className="sr-only">Buscar voos</h1>

      <BarraBusca inicial={inicial} onBuscar={aoBuscar} buscando={estado.tipo === 'carregando'} />

      {uso && uso.destinos_limite !== null && (
        <p className="-mt-3 text-sm tabular-nums text-texto-secundario" data-testid="uso-destinos">
          Hoje: {uso.destinos_usados} de {uso.destinos_limite} destinos diferentes.
        </p>
      )}

      <div className="flex flex-col gap-2 text-sm md:flex-row md:items-baseline md:justify-between">
        <MilheiroUsuario valor={milheiro} onAlterar={alterarMilheiro} />

        {ofertas.length > 0 && (
          <p className="text-texto-secundario">
            Ordenar por{' '}
            {criterios.map((c, i) => (
              <span key={c.valor}>
                <button
                  type="button"
                  onClick={() => setCriterio(c.valor)}
                  aria-pressed={criterio === c.valor}
                  className={cn(
                    'rounded-sm underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    criterio === c.valor
                      ? 'font-medium text-texto'
                      : 'underline decoration-fio hover:text-texto hover:decoration-texto',
                  )}
                >
                  {c.rotulo}
                </button>
                {i < criterios.length - 2 ? ', ' : i === criterios.length - 2 ? ' ou ' : ''}
              </span>
            ))}
          </p>
        )}
      </div>

      {!user && (
        <Aviso>
          Estes são resultados de exemplo.{' '}
          <Link to="/entrar" state={{ de: '/buscar' }} className={linkDiscreto}>
            Entre
          </Link>{' '}
          para buscar de verdade.
        </Aviso>
      )}

      {user && estado.tipo === 'ocioso' && (
        <Aviso>Escolha origem, destino e as datas e toque em Buscar para comparar dinheiro e milhas.</Aviso>
      )}
      {estado.tipo === 'carregando' && <Aviso>Buscando ofertas nas companhias…</Aviso>}
      {estado.tipo === 'erro' && (
        <Aviso alerta>
          {estado.erro.mensagem}
          {estado.erro.codigo === 'assinatura_inativa' && (
            <>
              {' '}
              <Link to="/assinar" className={linkDiscreto}>
                Ver planos
              </Link>
            </>
          )}
        </Aviso>
      )}

      {pronto?.modo === 'mock' && (
        <Aviso>
          Resultados de teste (banco fake): os preços não são reais. Rotas de teste: SAO ou GRU para SSA ou LIS, e CNF
          para GRU.
        </Aviso>
      )}
      {pronto?.falhas.map((falha) => (
        <Aviso key={falha} alerta>
          {falha}
        </Aviso>
      ))}

      {(!user || pronto) && (
        <>
          <GrupoResultados
            titulo={comVolta && pronto ? `Ida, ${formatarData(pronto.pedido.dataIda)}` : undefined}
            ofertas={ida}
            milheiro={milheiro}
            criterio={criterio}
            vazio="Nenhum voo com preço em dinheiro e em milhas para esta busca."
            onQuero={aoQuerer}
            leads={leads}
          />
          {comVolta && pronto?.pedido.dataVolta && (
            <GrupoResultados
              titulo={`Volta, ${formatarData(pronto.pedido.dataVolta)}`}
              ofertas={volta}
              milheiro={milheiro}
              criterio={criterio}
              vazio="Nenhum voo com preço em dinheiro e em milhas para a volta."
              onQuero={aoQuerer}
              leads={leads}
            />
          )}
        </>
      )}

      {alertaRecente && <FaixaAlerta alerta={alertaRecente} />}
    </div>
  )
}
