import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'

import { CampoTexto } from '@/components/CampoTexto'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/useAuth'
import { usePlano } from '@/hooks/usePlano'
import { useMinhaAssinatura } from '@/hooks/useMinhaAssinatura'
import { useSincronizarAssinatura } from '@/hooks/useSincronizarAssinatura'
import { useTelegram } from '@/hooks/useTelegram'
import { dataBR, situacaoDaAssinatura } from '@/lib/cancelamento'
import type { Perfil } from '@/contexts/auth-context'
import { interpretarMilheiro, milheiroParaCampo } from '@/lib/milheiro'

const nomesPlano: Record<string, string> = { base: 'Base', plus: 'Plus' }

const descricaoStatus: Record<string, string> = {
  pendente: 'aguardando pagamento',
  ativo: 'ativo',
  inadimplente: 'pagamento em atraso',
  cancelado: 'cancelado',
}

function FormularioDados({ perfil }: { perfil: Perfil }) {
  const { atualizarPerfil } = useAuth()
  const [nome, setNome] = useState(perfil.nome ?? '')
  const [telefone, setTelefone] = useState(perfil.telefone ?? '')
  const [milheiro, setMilheiro] = useState(perfil.custo_milheiro ? milheiroParaCampo(perfil.custo_milheiro) : '')
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const salvar = async (evento: FormEvent) => {
    evento.preventDefault()
    const custo = milheiro.trim() ? interpretarMilheiro(milheiro) : null
    if (milheiro.trim() && custo === null) {
      setMensagem('Milheiro inválido. Use um valor como 20,00.')
      return
    }
    setSalvando(true)
    const { erro } = await atualizarPerfil({
      nome: nome.trim() || null,
      telefone: telefone.trim() || null,
      custo_milheiro: custo,
    })
    setSalvando(false)
    setMensagem(erro ?? 'Dados salvos.')
  }

  return (
    <form onSubmit={salvar} noValidate className="flex flex-col gap-4 rounded-md border border-fio bg-superficie p-5">
      <CampoTexto id="conta-nome" rotulo="Nome" autoComplete="name" value={nome} onChange={(e) => setNome(e.target.value)} />
      <CampoTexto
        id="conta-telefone"
        rotulo="Telefone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        value={telefone}
        onChange={(e) => setTelefone(e.target.value)}
      />
      <CampoTexto
        id="conta-milheiro"
        rotulo="Seu milheiro (R$ por 1.000 milhas)"
        inputMode="decimal"
        placeholder="20,00"
        ajuda="Quanto você paga, em média, por mil milhas. É a base de todos os vereditos."
        className="tabular-nums"
        value={milheiro}
        onChange={(e) => setMilheiro(e.target.value)}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar'}
        </Button>
        {mensagem && (
          <p role="status" className="text-sm text-texto-secundario">
            {mensagem}
          </p>
        )}
      </div>
    </form>
  )
}

function AlertasTelegram() {
  const { conectado, carregando, conectar, desconectar } = useTelegram()
  const [trabalhando, setTrabalhando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [aberto, setAberto] = useState(false)

  const abrirTelegram = async () => {
    setTrabalhando(true)
    setErro(null)
    const { erro: falha, url } = await conectar()
    setTrabalhando(false)
    if (falha || !url) {
      setErro(falha)
      return
    }
    setAberto(true)
    window.open(url, '_blank', 'noopener')
  }

  const sair = async () => {
    setTrabalhando(true)
    setErro((await desconectar()).erro)
    setTrabalhando(false)
    setAberto(false)
  }

  return (
    <section aria-labelledby="titulo-telegram" className="border-t border-fio pt-5">
      <h2 id="titulo-telegram" className="font-normal">
        Alertas no Telegram
      </h2>
      {carregando ? (
        <p className="mt-1 text-sm text-texto-secundario">Carregando…</p>
      ) : conectado ? (
        <>
          <p className="mt-1 text-sm text-texto-secundario">Telegram conectado. Você recebe aqui os alertas de preço das suas rotas.</p>
          <Button size="sm" variant="contorno" className="mt-3" onClick={() => void sair()} disabled={trabalhando}>
            {trabalhando ? 'Desconectando…' : 'Desconectar'}
          </Button>
        </>
      ) : (
        <>
          <p className="mt-1 text-sm text-texto-secundario">
            Receba no Telegram o aviso quando um preço bater a meta de uma rota.
          </p>
          <Button size="sm" className="mt-3" onClick={() => void abrirTelegram()} disabled={trabalhando}>
            {trabalhando ? 'Abrindo…' : 'Conectar Telegram'}
          </Button>
          {aberto && (
            <p role="status" className="mt-2 text-sm text-texto-secundario">
              No Telegram, toque em Iniciar e depois volte a esta página. O link vale por 15 minutos.
            </p>
          )}
        </>
      )}
      {erro && (
        <p role="alert" className="mt-2 text-sm text-texto">
          {erro}
        </p>
      )}
    </section>
  )
}

function GerenciarAssinatura({ plano }: { plano: string }) {
  const { assinatura, cancelar, reativar } = useMinhaAssinatura()
  const [confirmando, setConfirmando] = useState(false)
  const [trabalhando, setTrabalhando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const situacao = situacaoDaAssinatura(assinatura)

  const executar = async (acao: () => Promise<{ erro: string | null; faturaUrl?: string | null }>) => {
    setTrabalhando(true)
    setErro(null)
    const resultado = await acao()
    setTrabalhando(false)
    setConfirmando(false)
    setErro(resultado.erro)
    // Reativar abre a fatura do período seguinte, se o Asaas já a gerou.
    if (!resultado.erro && resultado.faturaUrl) window.location.assign(resultado.faturaUrl)
  }

  if (situacao.tipo === 'outra') return null

  return (
    <div className="mt-3 flex flex-col gap-2 text-sm">
      {situacao.tipo === 'ativa' && (
        <>
          {situacao.renovaEm && <p className="text-texto-secundario">Renova em {dataBR(situacao.renovaEm)}.</p>}
          {confirmando ? (
            <div role="alertdialog" aria-label="Confirmar cancelamento" className="flex flex-col gap-2 rounded-md border border-fio bg-superficie p-3">
              <p className="text-texto">
                Cancelar a assinatura?
                {situacao.renovaEm
                  ? ` Você continua com acesso até ${dataBR(situacao.renovaEm)} e não será cobrado de novo.`
                  : ' Você não será cobrado de novo.'}
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => void executar(cancelar)} disabled={trabalhando}>
                  {trabalhando ? 'Cancelando…' : 'Sim, cancelar'}
                </Button>
                <Button size="sm" variant="contorno" onClick={() => setConfirmando(false)} disabled={trabalhando}>
                  Manter assinatura
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <Button size="sm" variant="contorno" onClick={() => setConfirmando(true)}>
                Cancelar assinatura
              </Button>
            </div>
          )}
        </>
      )}
      {situacao.tipo === 'cancelada' && (
        <>
          <p className="text-texto">Assinatura cancelada. Seu acesso vai até {dataBR(situacao.acessoAte)}.</p>
          <div>
            <Button size="sm" variant="contorno" onClick={() => void executar(() => reativar(plano))} disabled={trabalhando}>
              {trabalhando ? 'Reativando…' : 'Reativar assinatura'}
            </Button>
          </div>
        </>
      )}
      {erro && (
        <p role="alert" className="text-texto">
          {erro}
        </p>
      )}
    </div>
  )
}

export function Conta() {
  const { user, perfil, sair } = useAuth()
  const { plano } = usePlano()
  useSincronizarAssinatura()

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-medium">Conta</h1>
        <p className="mt-1 text-sm text-texto-secundario">{user?.email}</p>
      </div>

      {perfil ? (
        // A key recria o formulário com os valores do banco quando o perfil chega ou muda de usuário.
        <FormularioDados key={perfil.id} perfil={perfil} />
      ) : (
        <p className="text-sm text-texto-secundario">Carregando seus dados…</p>
      )}

      {perfil && (
        <section aria-labelledby="titulo-plano" className="border-t border-fio pt-5">
          <h2 id="titulo-plano" className="font-normal">
            Plano
          </h2>
          <p className="mt-1 text-sm text-texto-secundario">
            {perfil.plano
              ? `${nomesPlano[perfil.plano] ?? perfil.plano}, ${descricaoStatus[perfil.status_assinatura] ?? perfil.status_assinatura}.`
              : 'Você ainda não assinou um plano.'}
          </p>
          {perfil.status_assinatura !== 'ativo' && perfil.papel !== 'admin' && (
            <Button asChild size="sm" className="mt-3">
              <Link to="/assinar">{perfil.status_assinatura === 'inadimplente' ? 'Regularizar pagamento' : 'Escolher um plano'}</Link>
            </Button>
          )}
          {perfil.status_assinatura === 'ativo' && perfil.plano && perfil.papel !== 'admin' && (
            <GerenciarAssinatura plano={perfil.plano} />
          )}
          {plano && perfil.status_assinatura === 'ativo' && (
            <p className="text-sm text-texto-secundario">
              Até {plano.destinos_por_dia} destinos diferentes por dia e {plano.rotas_com_alerta} rotas com alerta.
            </p>
          )}
        </section>
      )}

      <AlertasTelegram />

      <div className="border-t border-fio pt-5">
        <Button variant="contorno" onClick={() => void sair()}>
          Sair da conta
        </Button>
      </div>
    </div>
  )
}
