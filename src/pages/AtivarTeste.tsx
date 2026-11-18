import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/useAuth'
import { useAssinatura } from '@/hooks/useAssinatura'
import { useMilheiro } from '@/hooks/useMilheiro'
import { cpfValido, formatarCpfCnpj } from '@/lib/assinatura'
import { formatarReaisComCentavos } from '@/lib/formato'
import { cn } from '@/lib/utils'

/** Dias de teste antes da primeira cobrança (o mesmo número da função assinar). */
const DIAS_TESTE = 7

/** Leva o navegador ao checkout do Asaas, onde a pessoa cadastra o cartão. */
const irParaCheckout = (url: string) => window.location.assign(url)

function vantagens(rotas: number | null) {
  return [
    'Compare dinheiro e milhas em cada voo, com o seu milheiro.',
    rotas
      ? `Salve até ${rotas} ${rotas === 1 ? 'rota' : 'rotas'} e receba alerta quando o preço chegar na sua meta.`
      : 'Salve rotas e receba alerta quando o preço chegar na sua meta.',
    'A equipe da Volare emite a passagem para você.',
  ]
}

/**
 * "Ativar teste grátis" (passo 3 de 3): escolhe o plano, informa o CPF e segue para o checkout do Asaas.
 * O cartão é cadastrado na página do Asaas; a primeira cobrança vem DIAS_TESTE dias depois.
 */
export function AtivarTeste() {
  const { perfil } = useAuth()
  const { milheiro } = useMilheiro()
  const { planos, carregando, ativarTeste } = useAssinatura()
  const [escolhido, setEscolhido] = useState<string | null>(null)
  const [cpf, setCpf] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [testeUsado, setTesteUsado] = useState(false)
  const [enviando, setEnviando] = useState(false)

  const plano = planos.find((p) => p.plano === escolhido) ?? planos[0] ?? null
  const ativo = perfil?.status_assinatura === 'ativo'

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault()
    if (!plano) return
    if (!cpfValido(cpf)) {
      setErro('CPF inválido. Confira os números.')
      return
    }
    setErro(null)
    setTesteUsado(false)
    setEnviando(true)
    const { erro: falha, codigo, faturaUrl } = await ativarTeste(plano.plano, cpf)
    if (falha || !faturaUrl) {
      setEnviando(false)
      setErro(falha ?? 'Não foi possível abrir o cadastro do cartão agora. Tente de novo em instantes.')
      setTesteUsado(codigo === 'teste_usado')
      return
    }
    irParaCheckout(faturaUrl)
  }

  return (
    <div className="flex min-h-dvh flex-wrap bg-vm-surface-page">
      <aside className="flex min-h-[420px] flex-[1_1_420px] flex-col gap-8 bg-vm-navy-900 bg-[url(/fotos/painel-asa-noite.webp)] bg-cover bg-bottom bg-no-repeat p-6 text-white md:min-h-[640px] md:p-12">
        <Link to="/" className="self-start rounded-vm-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
          <img src="/brand/volo-logo-branco.svg" alt="Volo by Volare, ir para a home" className="h-24 w-auto" />
        </Link>
        <div>
          <h2 className="text-[30px] font-semibold leading-9 md:text-[36px] md:leading-[42px]">
            {DIAS_TESTE} dias para testar, sem pagar nada
          </h2>
          <ul className="mt-6 flex max-w-[440px] flex-col gap-3.5">
            {vantagens(plano?.rotas_com_alerta ?? null).map((item) => (
              <li key={item} className="flex gap-3 text-base opacity-90">
                <span className="mt-2 h-2 w-2 flex-none rounded-full bg-vm-gold-500" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="flex min-w-0 flex-[999_1_520px] items-start justify-center px-4 py-8 md:px-6 md:py-12">
        {ativo ? (
          <div className="flex w-full max-w-[480px] flex-col gap-4 rounded-vm-md bg-vm-surface-card p-6 md:p-8">
            <h1 className="text-[28px] font-semibold leading-[34px]">Sua assinatura já está ativa</h1>
            <p className="text-vm-ink-muted">Você já pode buscar voos e salvar rotas com alerta.</p>
            <Button asChild size="lg" className="w-full text-base">
              <Link to="/buscar">Buscar voos</Link>
            </Button>
          </div>
        ) : (
          <form
            onSubmit={(e) => void enviar(e)}
            noValidate
            aria-labelledby="titulo-teste"
            className="flex w-full max-w-[480px] flex-col gap-5 rounded-vm-md bg-vm-surface-card p-6 md:p-8"
          >
            <div>
              <p className="text-label text-vm-ink-muted">Passo 3 de 3</p>
              <div className="mt-2 flex gap-1.5" aria-hidden>
                <span className="h-1 flex-1 rounded-vm-pill bg-vm-navy-700" />
                <span className="h-1 flex-1 rounded-vm-pill bg-vm-navy-700" />
                <span className="h-1 flex-1 rounded-vm-pill bg-vm-gold-500" />
              </div>
            </div>

            <div>
              <h1 id="titulo-teste" className="text-[28px] font-semibold leading-[34px]">
                Ative seu teste grátis
              </h1>
              <p className="mt-2 text-vm-ink-muted">
                {plano ? (
                  <>
                    A primeira cobrança de{' '}
                    <strong className="font-semibold text-vm-navy-700 vm-num">{formatarReaisComCentavos(plano.preco_mensal)}</strong>{' '}
                    acontece só depois de {DIAS_TESTE} dias, no cartão que você cadastrar. Você pode cancelar quando quiser,
                    na sua conta.
                  </>
                ) : (
                  `Nada é cobrado nos primeiros ${DIAS_TESTE} dias. Você pode cancelar quando quiser, na sua conta.`
                )}
              </p>
            </div>

            {carregando ? (
              <p className="text-body-sm text-vm-ink-muted">Carregando os planos…</p>
            ) : (
              planos.length > 0 && (
                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-2 text-label text-vm-ink-muted">Plano</legend>
                  <div className="grid grid-cols-2 gap-3">
                    {planos.map((p) => {
                      const marcado = plano?.plano === p.plano
                      return (
                        <label
                          key={p.plano}
                          className={cn(
                            'flex cursor-pointer flex-col gap-0.5 rounded-vm-sm border bg-vm-surface-card px-4 py-3 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-vm-navy-700',
                            marcado ? 'border-vm-navy-700 shadow-[0_0_0_1px_var(--vm-navy-700)]' : 'border-vm-border-control',
                          )}
                        >
                          <input
                            type="radio"
                            name="plano-teste"
                            value={p.plano}
                            checked={marcado}
                            onChange={() => setEscolhido(p.plano)}
                            className="sr-only"
                          />
                          <span className="font-semibold">{p.nome}</span>
                          <span className="text-body-sm text-vm-ink-muted vm-num">
                            {formatarReaisComCentavos(p.preco_mensal)} por mês
                          </span>
                          <span className="text-[13px] leading-[18px] text-vm-ink-muted">
                            {p.rotas_com_alerta} {p.rotas_com_alerta === 1 ? 'rota' : 'rotas'} com alerta
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </fieldset>
              )
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="teste-cpf">CPF</Label>
              <Input
                id="teste-cpf"
                inputMode="numeric"
                autoComplete="off"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(formatarCpfCnpj(e.target.value).slice(0, 14))}
                aria-invalid={erro && !testeUsado ? true : undefined}
                aria-describedby={erro ? 'teste-cpf-erro teste-cpf-ajuda' : 'teste-cpf-ajuda'}
                className="vm-num"
              />
              {erro && (
                <p id="teste-cpf-erro" role="alert" className="text-[13px] leading-[18px] text-vm-burgundy-600">
                  {erro}{' '}
                  {testeUsado && (
                    <Link to="/assinar" className="font-semibold underline underline-offset-[3px]">
                      Ver planos
                    </Link>
                  )}
                </p>
              )}
              <p id="teste-cpf-ajuda" className="text-[13px] leading-[18px] text-vm-ink-muted">
                Usamos o CPF só para criar a assinatura no Asaas. Ele não fica guardado conosco.
              </p>
            </div>

            <Button type="submit" size="lg" className="w-full text-base" disabled={enviando || !plano} aria-busy={enviando || undefined}>
              {enviando ? 'Abrindo a página do Asaas…' : 'Ativar teste grátis'}
            </Button>

            <p className="flex gap-2 text-[13px] leading-[18px] text-vm-ink-muted">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden
                className="mt-px flex-none"
              >
                <rect x="3" y="7" width="10" height="7" rx="1.5" />
                <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
              </svg>
              Você vai cadastrar o cartão numa página segura do Asaas. O cartão não passa pelo Volo.
            </p>

            <p className="border-t border-vm-line pt-4 text-[13px] text-vm-ink-muted">
              Conta criada e milheiro definido em{' '}
              <strong className="text-vm-navy-700 vm-num">{formatarReaisComCentavos(milheiro)}</strong>.{' '}
              <Link to="/" className="font-medium text-vm-gold-700 underline underline-offset-[3px] hover:text-vm-navy-700">
                Alterar
              </Link>
            </p>
          </form>
        )}
      </main>
    </div>
  )
}
