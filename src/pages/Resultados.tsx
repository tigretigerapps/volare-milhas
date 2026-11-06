import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'

import { BarraBusca, type ParametrosBusca } from '@/components/BarraBusca'
import { FaixaAlerta } from '@/components/FaixaAlerta'
import { LinhaResultado } from '@/components/LinhaResultado'
import { MilheiroUsuario } from '@/components/MilheiroUsuario'
import { Button } from '@/components/ui/button'
import { useAlertas } from '@/contexts/useAlertas'
import { useAuth } from '@/contexts/useAuth'
import { ofertasExemplo, type Oferta } from '@/data/exemplo'
import { useBuscaVoos, type StatusCompanhia } from '@/hooks/useBuscaVoos'
import { useLeads, type EstadoLead } from '@/hooks/useLeads'
import { useMilheiro } from '@/hooks/useMilheiro'
import { buscarAeroportoPorCodigo } from '@/lib/aeroportos'
import { companhiasPadrao, separarPorSentido } from '@/lib/busca'
import { ordenarOfertas, type CriterioOrdenacao } from '@/lib/comparacao'
import { dataPorExtenso, hojeISO, somarDiasISO } from '@/lib/datas'
import { formatarData } from '@/lib/rotas'
import { lerBuscaDaUrl, urlResultados } from '@/lib/urlBusca'

const criterios: { valor: CriterioOrdenacao; rotulo: string }[] = [
  { valor: 'economia', rotulo: 'Maior economia' },
  { valor: 'horario', rotulo: 'Horário' },
  { valor: 'duracao', rotulo: 'Duração' },
]

const nomesCompanhias: Record<string, string> = { GOL: 'GOL', AZUL: 'Azul', LATAM: 'LATAM', TAP: 'TAP' }
const nomeCompanhia = (codigo: string) => nomesCompanhias[codigo.toUpperCase()] ?? codigo

const cidade = (codigo: string) => buscarAeroportoPorCodigo(codigo)?.cidade ?? codigo
const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`

const linkDiscreto = 'font-medium text-vm-navy-700 underline underline-offset-[3px] hover:text-vm-gold-700'

function Aviso({ children, alerta = false }: { children: ReactNode; alerta?: boolean }) {
  return (
    <p
      role={alerta ? 'alert' : 'status'}
      className="rounded-vm-md bg-vm-surface-card px-4 py-3.5 text-sm text-vm-ink-muted md:px-6"
    >
      {children}
    </p>
  )
}

/** Bloco da lista: no celular os cards ficam soltos; no desktop, um bloco branco com fio entre as linhas. */
const classeBloco = 'flex flex-col gap-3 md:block md:overflow-hidden md:rounded-vm-md md:bg-vm-surface-card'

function GrupoResultados({
  titulo,
  ofertas,
  milheiro,
  criterio,
  vazio,
  onQuero,
  leads,
  extras,
}: {
  titulo?: string
  ofertas: Oferta[]
  milheiro: number
  criterio: CriterioOrdenacao
  vazio: string
  onQuero: (oferta: Oferta) => void
  leads: Record<string, EstadoLead>
  /** Linhas de estado das companhias, no fim do bloco. */
  extras?: ReactNode
}) {
  const ordenadas = ordenarOfertas(ofertas, criterio, milheiro)
  return (
    <section aria-label={titulo ?? 'Resultados'} className="flex flex-col gap-3">
      {titulo && <h2 className="text-title">{titulo}</h2>}
      <div className={classeBloco}>
        {ordenadas.length === 0 ? (
          <p className="rounded-vm-md bg-vm-surface-card p-4 text-sm text-vm-ink-muted md:rounded-none md:p-6">{vazio}</p>
        ) : (
          <ul className="flex flex-col gap-3 md:block">
            {ordenadas.map((oferta) => (
              <LinhaResultado key={oferta.id} oferta={oferta} milheiro={milheiro} onQuero={onQuero} lead={leads[oferta.id]} />
            ))}
          </ul>
        )}
        {extras}
      </div>
    </section>
  )
}

/** Linha esqueleto enquanto a busca roda: as duas barras em cinza e "Consultando GOL…". */
function LinhaCarregando({ companhia }: { companhia: string }) {
  return (
    <li className="flex flex-col gap-3 rounded-vm-md bg-vm-surface-card p-4 md:grid md:grid-cols-[repeat(auto-fit,minmax(260px,1fr))] md:items-center md:gap-6 md:rounded-none md:border-b md:border-vm-line md:bg-transparent md:p-6 md:last:border-b-0">
      <p className="text-sm text-vm-ink-muted">Consultando {nomeCompanhia(companhia)}…</p>
      <div aria-hidden className="flex flex-col gap-2">
        <div className="h-2.5 w-3/4 rounded-[2px] bg-vm-line motion-safe:animate-pulse" />
        <div className="h-2.5 w-1/2 rounded-[2px] bg-vm-line motion-safe:animate-pulse" />
      </div>
    </li>
  )
}

function SemVoos({ companhia }: { companhia: string }) {
  return (
    <p className="rounded-vm-md bg-vm-surface-card px-4 py-3 text-[13px] text-vm-ink-muted md:rounded-none md:border-b md:border-vm-line md:px-6 md:last:border-b-0">
      {nomeCompanhia(companhia)} sem voos nessa data
    </p>
  )
}

function ErroCompanhia({ companhia, onTentar }: { companhia: string; onTentar: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-vm-md bg-vm-surface-page px-4 py-3.5 text-sm md:flex-row md:items-center md:justify-between md:rounded-none md:px-6"
    >
      <p>
        Não conseguimos consultar a {nomeCompanhia(companhia)} agora. As outras companhias não foram afetadas.
      </p>
      <Button variant="contorno" size="sm" className="h-11 flex-none md:h-[38px]" onClick={onTentar}>
        Tentar de novo
      </Button>
    </div>
  )
}

export function Resultados() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { recente: alertaRecente } = useAlertas()
  const { estado, buscar } = useBuscaVoos()
  const { estados: leads, querer } = useLeads()
  const { milheiro, alterar } = useMilheiro()
  const [criterio, setCriterio] = useState<CriterioOrdenacao>('economia')

  const daUrl = lerBuscaDaUrl(searchParams)
  const busca: ParametrosBusca = daUrl ?? {
    origem: 'GRU',
    destino: 'SSA',
    ida: somarDiasISO(hojeISO(), 30),
    volta: '',
  }
  const aqui = `${location.pathname}${location.search}`

  const executar = useCallback(
    (p: ParametrosBusca) =>
      void buscar({
        origem: p.origem,
        destino: p.destino,
        dataIda: p.ida,
        dataVolta: p.volta || null,
        companhias: companhiasPadrao,
      }),
    [buscar],
  )

  // A busca vem da URL: abrir o link (ou buscar de novo, que troca a URL) dispara a consulta.
  const chave = daUrl ? urlResultados(daUrl) : null
  const userId = user?.id
  useEffect(() => {
    if (!userId || !chave) return
    const p = lerBuscaDaUrl(new URLSearchParams(chave.split('?')[1]))
    if (p) executar(p)
  }, [userId, chave, executar])

  const aoBuscar = (p: ParametrosBusca) => {
    if (!user) {
      navigate('/entrar', { state: { de: urlResultados(p) } })
      return
    }
    const destino = urlResultados(p)
    // Mesma busca: a URL não muda, então consulta de novo aqui.
    if (destino === aqui) executar(p)
    else navigate(destino)
  }

  const pronto = estado.tipo === 'pronto' ? estado : null

  const aoQuerer = (oferta: Oferta) => {
    if (!user || !pronto) {
      navigate('/entrar', { state: { de: aqui } })
      return
    }
    void querer(oferta, pronto.pedido)
  }

  const uso = pronto?.uso ?? (estado.tipo === 'erro' ? estado.erro.uso : undefined)
  // Sem conta, a tela mostra os exemplos fixos; com conta, só o que a busca devolveu.
  const ofertas = user ? (pronto?.ofertas ?? []) : ofertasExemplo
  const { ida, volta } = separarPorSentido(ofertas)
  const comVolta = Boolean(pronto?.pedido.dataVolta)
  const mostrarLista = !user || pronto
  const numCompanhias = new Set(ofertas.map((o) => (o.companhia ?? o.programa).toUpperCase())).size

  const statusCompanhias: StatusCompanhia[] = pronto?.companhias ?? []
  const comErro = statusCompanhias.filter((c) => c.status === 'erro')
  const semVoos = pronto
    ? statusCompanhias.filter(
        (c) => c.status === 'ok' && !pronto.ofertas.some((o) => o.companhia?.toUpperCase() === c.companhia.toUpperCase()),
      )
    : []
  const extras =
    ofertas.length > 0 && (semVoos.length > 0 || comErro.length > 0) ? (
      <>
        {semVoos.map((c) => (
          <SemVoos key={c.companhia} companhia={c.companhia} />
        ))}
        {comErro.map((c) => (
          <ErroCompanhia key={c.companhia} companhia={c.companhia} onTentar={() => daUrl && executar(daUrl)} />
        ))}
      </>
    ) : null

  return (
    <>
      <BarraBusca
        key={aqui}
        variante="compacto"
        inicial={busca}
        onBuscar={aoBuscar}
        buscando={estado.tipo === 'carregando'}
      />

      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 pb-16 pt-6 md:px-6 md:pt-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold leading-[30px] md:text-heading-l">
              <span className="hidden md:inline">
                {user
                  ? `${cidade(busca.origem)} para ${cidade(busca.destino)}, ${dataPorExtenso(busca.ida)}`
                  : `Exemplo: ${cidade(ofertasExemplo[0].origem)} para ${cidade(ofertasExemplo[0].destino)}`}
              </span>
              <span className="md:hidden">
                {mostrarLista ? `${plural(ofertas.length, 'tarifa encontrada', 'tarifas encontradas')}` : 'Sua busca'}
              </span>
            </h1>
            <MilheiroUsuario
              valor={milheiro}
              onAlterar={alterar}
              pontoFinal
              rotuloEditar="Editar milheiro"
              prefixo={
                mostrarLista && ofertas.length > 0
                  ? `${plural(ofertas.length, 'tarifa', 'tarifas')} em ${plural(numCompanhias, 'companhia', 'companhias')}, comparadas com o seu milheiro de `
                  : 'Comparamos com o seu milheiro de '
              }
            />
          </div>

          {ofertas.length > 0 && (
            <div role="group" aria-label="Ordenar por" className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-vm-ink-muted" aria-hidden>
                Ordenar por
              </span>
              {criterios.map((c) => (
                <Button
                  key={c.valor}
                  variant="pilula"
                  aria-pressed={criterio === c.valor}
                  onClick={() => setCriterio(c.valor)}
                >
                  {c.rotulo}
                </Button>
              ))}
            </div>
          )}
        </div>

        {uso && uso.destinos_limite !== null && (
          <p className="-mt-3 text-[13px] text-vm-ink-muted vm-num" data-testid="uso-destinos">
            Hoje: {uso.destinos_usados} de {uso.destinos_limite} destinos diferentes.
          </p>
        )}

        {!user && (
          <Aviso>
            Estes são resultados de exemplo.{' '}
            <Link to="/entrar" state={{ de: aqui }} className={linkDiscreto}>
              Entre
            </Link>{' '}
            para buscar de verdade.
          </Aviso>
        )}

        {user && !daUrl && estado.tipo === 'ocioso' && (
          <Aviso>Escolha origem, destino e as datas e toque em Buscar para comparar dinheiro e milhas.</Aviso>
        )}

        {estado.tipo === 'carregando' && (
          <section aria-label="Consultando as companhias" aria-busy="true">
            <ul className={classeBloco}>
              {companhiasPadrao.map((c) => (
                <LinhaCarregando key={c} companhia={c} />
              ))}
            </ul>
          </section>
        )}

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

        {mostrarLista && (
          <>
            <GrupoResultados
              titulo={comVolta && pronto ? `Ida, ${formatarData(pronto.pedido.dataIda)}` : undefined}
              ofertas={ida}
              milheiro={milheiro}
              criterio={criterio}
              vazio="Nenhuma tarifa encontrada para essa data. Tente outro dia ou outra origem."
              onQuero={aoQuerer}
              leads={leads}
              extras={comVolta ? undefined : extras}
            />
            {comVolta && pronto?.pedido.dataVolta && (
              <GrupoResultados
                titulo={`Volta, ${formatarData(pronto.pedido.dataVolta)}`}
                ofertas={volta}
                milheiro={milheiro}
                criterio={criterio}
                vazio="Nenhuma tarifa encontrada para a volta. Tente outro dia."
                onQuero={aoQuerer}
                leads={leads}
                extras={extras}
              />
            )}
            {ofertas.length === 0 &&
              comErro.map((c) => (
                <ErroCompanhia key={c.companhia} companhia={c.companhia} onTentar={() => daUrl && executar(daUrl)} />
              ))}
          </>
        )}

        {alertaRecente && <FaixaAlerta alerta={alertaRecente} />}

        {mostrarLista && ofertas.length > 0 && (
          <p className="text-[13px] leading-[18px] text-vm-ink-muted">
            Ao clicar em “Quero essa oferta”, a equipe da Volare entra em contato para confirmar a disponibilidade e
            emitir a passagem. Valores por adulto, com taxas.
          </p>
        )}
      </div>
    </>
  )
}
