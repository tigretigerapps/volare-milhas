import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useAlertasAdmin,
  useAssinantesAdmin,
  useLeadsAdmin,
  usePlanosAdmin,
  type AssinanteAdmin,
  type LeadAdmin,
  type Plano,
} from '@/hooks/useAdmin'
import { interpretarDecimalBR } from '@/lib/numero-br'
import { formatarDataHora, referenciaLead, resumirOferta, rotuloCrm, statusAssinatura, statusLead } from '@/lib/admin'
import { cn } from '@/lib/utils'

const abas = [
  { id: 'leads', rotulo: 'Leads' },
  { id: 'assinantes', rotulo: 'Assinantes' },
  { id: 'planos', rotulo: 'Planos' },
  { id: 'alertas', rotulo: 'Alertas' },
] as const
type Aba = (typeof abas)[number]['id']

function Estado({ carregando, erro, vazio, quantidade }: { carregando: boolean; erro: string | null; vazio: string; quantidade: number }) {
  if (carregando) return <p className="py-6 text-sm text-texto-secundario">Carregando…</p>
  if (erro) return <p role="alert" className="py-6 text-sm text-texto">{erro}</p>
  if (quantidade === 0) return <p className="border-y border-fio py-6 text-sm text-texto-secundario">{vazio}</p>
  return null
}

function LinhaLead({
  lead,
  onStatus,
  onReenviar,
}: {
  lead: LeadAdmin
  onStatus: (id: string, status: string) => Promise<{ erro: string | null }>
  onReenviar: (id: string) => Promise<{ erro: string | null }>
}) {
  const [erro, setErro] = useState<string | null>(null)
  const [reenviando, setReenviando] = useState(false)

  const mudar = async (status: string) => setErro((await onStatus(lead.id, status)).erro)
  const reenviar = async () => {
    setReenviando(true)
    setErro((await onReenviar(lead.id)).erro)
    setReenviando(false)
  }

  const falhou = lead.crm_status === 'falhou'
  return (
    <li className="grid gap-3 py-4 md:grid-cols-[11rem_minmax(0,1fr)_14rem] md:items-start md:gap-6">
      <div>
        <p className="font-display text-lg font-medium tabular-nums">{referenciaLead(lead.id)}</p>
        <p className="text-sm tabular-nums text-texto-secundario">{formatarDataHora(lead.created_at)}</p>
      </div>

      <div className="min-w-0 text-sm">
        <p className="font-normal text-texto">{lead.profiles?.nome ?? 'Sem nome'}</p>
        <p className="text-texto-secundario">{lead.profiles?.telefone ?? 'Sem telefone'}</p>
        <p className="mt-1 text-texto-secundario">{resumirOferta(lead.oferta)}</p>
        <p className={cn('mt-1', falhou ? 'text-texto' : 'text-texto-secundario')}>{rotuloCrm(lead)}</p>
        {falhou && lead.crm_erro && <p className="mt-1 break-words text-xs text-texto-secundario">{lead.crm_erro}</p>}
        {erro && (
          <p role="alert" className="mt-1 text-texto">
            {erro}
          </p>
        )}
      </div>

      <div className="flex flex-col items-start gap-2">
        <Label htmlFor={`status-${lead.id}`} className="sr-only">
          Status do atendimento de {referenciaLead(lead.id)}
        </Label>
        <select
          id={`status-${lead.id}`}
          value={lead.status}
          onChange={(e) => void mudar(e.target.value)}
          className="h-10 w-full rounded-md border border-input bg-superficie px-3 text-base text-texto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {statusLead.map((s) => (
            <option key={s.valor} value={s.valor}>
              {s.rotulo}
            </option>
          ))}
        </select>
        {falhou && (
          <Button variant="contorno" size="sm" onClick={() => void reenviar()} disabled={reenviando}>
            {reenviando ? 'Reenviando…' : 'Reenviar ao CRM'}
          </Button>
        )}
      </div>
    </li>
  )
}

function Leads() {
  const { leads, carregando, erroCarga, mudarStatus, reenviar } = useLeadsAdmin()
  const falhas = leads.filter((l) => l.crm_status === 'falhou').length
  return (
    <section aria-label="Leads">
      {falhas > 0 && (
        <p role="status" className="mb-3 rounded-md border border-fio bg-superficie p-3 text-sm text-texto">
          {falhas} {falhas === 1 ? 'lead não chegou' : 'leads não chegaram'} ao CRM. Use Reenviar ao CRM em cada um.
        </p>
      )}
      <Estado carregando={carregando} erro={erroCarga} quantidade={leads.length} vazio="Nenhum lead ainda. Eles aparecem quando um assinante toca em Quero essa oferta." />
      {leads.length > 0 && (
        <ul className="divide-y divide-fio border-y border-fio">
          {leads.map((lead) => (
            <LinhaLead key={lead.id} lead={lead} onStatus={mudarStatus} onReenviar={reenviar} />
          ))}
        </ul>
      )}
    </section>
  )
}

function LinhaAssinante({ a }: { a: AssinanteAdmin }) {
  const status = statusAssinatura[a.status_assinatura] ?? a.status_assinatura
  const proxima = a.assinatura?.proxima_cobranca?.split('-').reverse().join('/')
  return (
    <li className="grid gap-1 py-4 text-sm md:grid-cols-[minmax(0,1fr)_10rem_10rem_10rem] md:items-center md:gap-6">
      <div className="min-w-0">
        <p className="font-normal text-texto">
          {a.nome ?? 'Sem nome'}
          {a.papel === 'admin' && <span className="ml-2 text-texto-secundario">(administrador)</span>}
        </p>
        <p className="text-texto-secundario">{a.telefone ?? 'Sem telefone'}</p>
      </div>
      <p className="text-texto">Plano {a.plano ?? 'nenhum'}</p>
      <p className="text-texto">
        {status}
        {a.assinatura?.acesso_ate && <span className="block text-texto-secundario">Cancelada, acesso até {a.assinatura.acesso_ate.split('-').reverse().join('/')}</span>}
      </p>
      <p className="tabular-nums text-texto-secundario">{proxima ? `Próxima cobrança ${proxima}` : 'Sem cobrança agendada'}</p>
    </li>
  )
}

function Assinantes() {
  const { assinantes, carregando, erroCarga } = useAssinantesAdmin()
  return (
    <section aria-label="Assinantes">
      <Estado carregando={carregando} erro={erroCarga} quantidade={assinantes.length} vazio="Nenhum assinante cadastrado." />
      {assinantes.length > 0 && (
        <ul className="divide-y divide-fio border-y border-fio">
          {assinantes.map((a) => (
            <LinhaAssinante key={a.id} a={a} />
          ))}
        </ul>
      )}
      <p className="mt-3 text-sm text-texto-secundario">
        A situação da assinatura passa a ser atualizada sozinha quando a cobrança recorrente for ligada.
      </p>
    </section>
  )
}

function FormularioPlano({ plano, onSalvar }: { plano: Plano; onSalvar: (plano: string, l: Pick<Plano, 'destinos_por_dia' | 'rotas_com_alerta' | 'preco_mensal'>) => Promise<{ erro: string | null }> }) {
  const [destinos, setDestinos] = useState(String(plano.destinos_por_dia))
  const [rotas, setRotas] = useState(String(plano.rotas_com_alerta))
  const [preco, setPreco] = useState(String(plano.preco_mensal).replace('.', ','))
  const [mensagem, setMensagem] = useState<{ erro: boolean; texto: string } | null>(null)
  const [salvando, setSalvando] = useState(false)

  const inteiro = (v: string) => (/^\d+$/.test(v.trim()) ? Number(v) : null)

  const salvar = async (evento: FormEvent) => {
    evento.preventDefault()
    const d = inteiro(destinos)
    const r = inteiro(rotas)
    if (d === null || r === null) {
      setMensagem({ erro: true, texto: 'Use números inteiros, de 0 para cima.' })
      return
    }
    const p = interpretarDecimalBR(preco)
    if (p === null) {
      setMensagem({ erro: true, texto: 'Preço inválido. Use um valor como 29,90.' })
      return
    }
    setSalvando(true)
    const { erro } = await onSalvar(plano.plano, { destinos_por_dia: d, rotas_com_alerta: r, preco_mensal: p })
    setSalvando(false)
    setMensagem(erro ? { erro: true, texto: erro } : { erro: false, texto: 'Salvo.' })
  }

  return (
    <form onSubmit={salvar} noValidate aria-label={`Plano ${plano.nome}`} className="flex flex-col gap-4 rounded-md border border-fio bg-superficie p-5">
      <h3 className="font-display text-lg font-medium">{plano.nome}</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`destinos-${plano.plano}`}>Destinos por dia</Label>
          <Input id={`destinos-${plano.plano}`} inputMode="numeric" value={destinos} onChange={(e) => setDestinos(e.target.value)} className="tabular-nums" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`rotas-${plano.plano}`}>Rotas com alerta</Label>
          <Input id={`rotas-${plano.plano}`} inputMode="numeric" value={rotas} onChange={(e) => setRotas(e.target.value)} className="tabular-nums" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`preco-${plano.plano}`}>Preço mensal (R$)</Label>
        <Input id={`preco-${plano.plano}`} inputMode="decimal" value={preco} onChange={(e) => setPreco(e.target.value)} className="tabular-nums" />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar'}
        </Button>
        {mensagem && (
          <p role={mensagem.erro ? 'alert' : 'status'} className="text-sm text-texto-secundario">
            {mensagem.texto}
          </p>
        )}
      </div>
    </form>
  )
}

function Planos() {
  const { planos, carregando, erroCarga, salvar } = usePlanosAdmin()
  return (
    <section aria-label="Planos">
      <Estado carregando={carregando} erro={erroCarga} quantidade={planos.length} vazio="Nenhum plano cadastrado." />
      <div className="grid gap-4 md:grid-cols-2">
        {planos.map((p) => (
          <FormularioPlano key={`${p.plano}-${p.destinos_por_dia}-${p.rotas_com_alerta}`} plano={p} onSalvar={salvar} />
        ))}
      </div>
      <p className="mt-3 text-sm text-texto-secundario">
        O novo limite vale na próxima busca ou rota de cada assinante. O novo preço vale para quem assinar a partir de agora; quem já assina continua com o valor combinado no Asaas.
      </p>
    </section>
  )
}

function Alertas() {
  const { execucoes, carregando, erroCarga, verificarAgora } = useAlertasAdmin()
  const [verificando, setVerificando] = useState(false)
  const [mensagem, setMensagem] = useState<{ erro: boolean; texto: string } | null>(null)

  const verificar = async () => {
    setVerificando(true)
    setMensagem(null)
    const { erro, resumo } = await verificarAgora()
    setVerificando(false)
    if (erro || !resumo) {
      setMensagem({ erro: true, texto: erro ?? 'Não foi possível verificar agora.' })
      return
    }
    setMensagem({
      erro: false,
      texto: `Verificação concluída: ${resumo.rotas_verificadas} rotas, ${resumo.alertas_gerados} alertas novos.`,
    })
  }

  return (
    <section aria-label="Alertas" className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-texto-secundario">
          O sistema verifica as rotas salvas todo dia às 8h e avisa os assinantes quando um preço bate a meta.
        </p>
        <Button size="sm" onClick={() => void verificar()} disabled={verificando}>
          {verificando ? 'Verificando…' : 'Verificar agora'}
        </Button>
      </div>
      {mensagem && (
        <p role={mensagem.erro ? 'alert' : 'status'} className="rounded-md border border-fio bg-superficie p-3 text-sm text-texto">
          {mensagem.texto}
        </p>
      )}
      <Estado carregando={carregando} erro={erroCarga} quantidade={execucoes.length} vazio="Nenhuma verificação ainda." />
      {execucoes.length > 0 && (
        <ul className="divide-y divide-fio border-y border-fio">
          {execucoes.map((e) => (
            <li key={e.id} className="grid gap-1 py-3 text-sm md:grid-cols-[11rem_8rem_minmax(0,1fr)] md:gap-6">
              <p className="tabular-nums text-texto">{formatarDataHora(e.iniciado_em)}</p>
              <p className="text-texto-secundario">{e.origem === 'agendador' ? 'Automática' : 'Manual'}</p>
              <p className="tabular-nums text-texto-secundario">
                {e.rotas_verificadas} rotas, {e.buscas} consultas, {e.alertas_gerados} alertas
                {e.erros > 0 && <span className="text-texto">, {e.erros} falhas</span>}
                {e.detalhe && <span className="block">{e.detalhe}</span>}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function Admin() {
  const [aba, setAba] = useState<Aba>('leads')
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-medium">Painel administrativo</h1>

      <div role="tablist" aria-label="Seções do painel" className="flex gap-1 border-b border-fio">
        {abas.map((a) => (
          <button
            key={a.id}
            type="button"
            role="tab"
            id={`aba-${a.id}`}
            aria-selected={aba === a.id}
            aria-controls={`painel-${a.id}`}
            onClick={() => setAba(a.id)}
            className={cn(
              '-mb-px border-b-2 px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              aba === a.id ? 'border-texto font-medium text-texto' : 'border-transparent text-texto-secundario hover:text-texto',
            )}
          >
            {a.rotulo}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`painel-${aba}`} aria-labelledby={`aba-${aba}`}>
        {aba === 'leads' && <Leads />}
        {aba === 'assinantes' && <Assinantes />}
        {aba === 'planos' && <Planos />}
        {aba === 'alertas' && <Alertas />}
      </div>
    </div>
  )
}
