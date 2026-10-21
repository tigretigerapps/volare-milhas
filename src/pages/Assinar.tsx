import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'

import { CampoTexto } from '@/components/CampoTexto'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/useAuth'
import { useAssinatura } from '@/hooks/useAssinatura'
import { documentoCompleto, formatarCpfCnpj, situacaoAssinatura } from '@/lib/assinatura'
import { formatarReaisComCentavos } from '@/lib/formato'
import { cn } from '@/lib/utils'

/** Leva o navegador à página de pagamento do Asaas (PIX, cartão ou boleto). */
const irParaPagamento = (url: string) => window.location.assign(url)

export function Assinar() {
  const { perfil } = useAuth()
  const { planos, carregando, assinar, abrirFatura } = useAssinatura()
  const [escolhido, setEscolhido] = useState<string | null>(null)
  const [documento, setDocumento] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const status = perfil?.status_assinatura
  const plano = escolhido ?? (planos[0]?.plano ?? null)

  if (status === 'ativo') {
    return (
      <div className="mx-auto w-full max-w-lg">
        <h1 className="font-display text-2xl font-medium">Sua assinatura está ativa</h1>
        <p className="mt-2 text-texto-secundario">Para trocar de plano, fale com a equipe da Volare.</p>
        <Button asChild className="mt-6">
          <Link to="/buscar">Buscar voos</Link>
        </Button>
      </div>
    )
  }

  const abrir = async (acao: () => Promise<{ erro: string | null; faturaUrl?: string | null }>) => {
    setEnviando(true)
    setErro(null)
    const { erro: falha, faturaUrl } = await acao()
    if (falha) {
      setEnviando(false)
      setErro(falha)
      return
    }
    if (!faturaUrl) {
      setEnviando(false)
      setErro('Estamos preparando a sua cobrança. Aguarde alguns segundos e toque de novo.')
      return
    }
    irParaPagamento(faturaUrl)
  }

  const enviar = (evento: FormEvent) => {
    evento.preventDefault()
    if (!plano) return
    if (!documentoCompleto(documento)) {
      setErro('Informe seu CPF (11 números) ou CNPJ (14 números).')
      return
    }
    void abrir(() => assinar(plano, documento))
  }

  const comFaturaAberta = status === 'pendente' || status === 'inadimplente'

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-medium">Escolha seu plano</h1>
        <p className="mt-1 text-sm text-texto-secundario">
          Cobrança mensal, paga por PIX, cartão ou boleto em uma página segura do Asaas. Você escolhe como pagar na hora.
        </p>
        {status && status !== 'pendente' && (
          <p className="mt-1 text-sm text-texto-secundario">Situação atual: {situacaoAssinatura[status] ?? status}.</p>
        )}
      </div>

      {carregando ? (
        <p className="text-sm text-texto-secundario">Carregando planos…</p>
      ) : (
        <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
          <fieldset className="grid gap-3 md:grid-cols-2">
            <legend className="sr-only">Plano</legend>
            {planos.map((p) => (
              <label
                key={p.plano}
                className={cn(
                  'flex cursor-pointer flex-col gap-1 rounded-md border bg-superficie p-5 focus-within:ring-2 focus-within:ring-ring',
                  plano === p.plano ? 'border-texto' : 'border-fio',
                )}
              >
                <input
                  type="radio"
                  name="plano"
                  value={p.plano}
                  checked={plano === p.plano}
                  onChange={() => setEscolhido(p.plano)}
                  className="sr-only"
                />
                <span className="font-display text-lg font-medium">{p.nome}</span>
                <span className="font-display text-3xl font-light tabular-nums">
                  {formatarReaisComCentavos(p.preco_mensal)}
                  <span className="text-base text-texto-secundario"> por mês</span>
                </span>
                <span className="mt-2 text-sm text-texto-secundario">
                  Até {p.destinos_por_dia} destinos diferentes por dia e {p.rotas_com_alerta} rotas com alerta.
                </span>
              </label>
            ))}
          </fieldset>

          <CampoTexto
            id="assinar-documento"
            rotulo="CPF ou CNPJ"
            inputMode="numeric"
            autoComplete="off"
            ajuda="O Asaas pede o documento de quem paga para emitir a cobrança. Não guardamos esse número."
            className="tabular-nums"
            value={documento}
            onChange={(e) => setDocumento(formatarCpfCnpj(e.target.value))}
          />

          {erro && (
            <p role="alert" className="text-sm text-texto">
              {erro}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={enviando || !plano}>
              {enviando ? 'Abrindo o pagamento…' : 'Ir para o pagamento'}
            </Button>
            {comFaturaAberta && (
              <Button type="button" variant="contorno" disabled={enviando} onClick={() => void abrir(abrirFatura)}>
                Pagar a fatura em aberto
              </Button>
            )}
          </div>
        </form>
      )}
    </div>
  )
}
