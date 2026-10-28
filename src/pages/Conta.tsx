import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'

import { CampoTexto } from '@/components/CampoTexto'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/useAuth'
import { usePlano } from '@/hooks/usePlano'
import { useSincronizarAssinatura } from '@/hooks/useSincronizarAssinatura'
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
          {plano && perfil.status_assinatura === 'ativo' && (
            <p className="text-sm text-texto-secundario">
              Até {plano.destinos_por_dia} destinos diferentes por dia e {plano.rotas_com_alerta} rotas com alerta.
            </p>
          )}
        </section>
      )}

      <div className="border-t border-fio pt-5">
        <Button variant="contorno" onClick={() => void sair()}>
          Sair da conta
        </Button>
      </div>
    </div>
  )
}
