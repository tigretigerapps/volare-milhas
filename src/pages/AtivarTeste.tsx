import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useMilheiro } from '@/hooks/useMilheiro'
import { cpfValido, formatarCpfCnpj } from '@/lib/assinatura'
import { formatarReaisComCentavos } from '@/lib/formato'

/** Valor do plano mostrado na tela. No fluxo real virá de valor_plano(); por ora é fixo. */
const valorPlano = 29.9

const vantagens = [
  'Compare dinheiro e milhas em cada voo, com o seu milheiro.',
  'Salve até 3 rotas e receba alerta quando o preço chegar na sua meta.',
  'A equipe da Volare emite a passagem para você.',
]

/**
 * "Ativar teste grátis" (passo 3 de 3). Só o visual aprovado: valida o CPF aqui na tela
 * e não chama nenhum serviço. A assinatura de verdade continua em /assinar.
 */
export function AtivarTeste() {
  const { milheiro } = useMilheiro()
  const [cpf, setCpf] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [conferido, setConferido] = useState(false)

  const enviar = (evento: FormEvent) => {
    evento.preventDefault()
    setConferido(false)
    if (!cpfValido(cpf)) {
      setErro('CPF inválido. Confira os números.')
      return
    }
    setErro(null)
    setConferido(true)
  }

  return (
    <div className="flex min-h-dvh flex-wrap bg-vm-surface-page">
      <aside className="flex min-h-[420px] flex-[1_1_420px] flex-col gap-8 bg-vm-navy-900 bg-[url(/fotos/painel-asa-noite.webp)] bg-cover bg-bottom bg-no-repeat p-6 text-white md:min-h-[640px] md:p-12">
        <Link to="/" className="self-start rounded-vm-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
          <img src="/brand/volo-logo-branco.svg" alt="Volo by Volare, ir para a home" className="h-24 w-auto" />
        </Link>
        <div>
          <h2 className="text-[30px] font-semibold leading-9 md:text-[36px] md:leading-[42px]">
            30 dias para testar, sem pagar nada
          </h2>
          <ul className="mt-6 flex max-w-[440px] flex-col gap-3.5">
            {vantagens.map((item) => (
              <li key={item} className="flex gap-3 text-base opacity-90">
                <span className="mt-2 h-2 w-2 flex-none rounded-full bg-vm-gold-500" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="flex min-w-0 flex-[999_1_520px] items-start justify-center px-4 py-8 md:px-6 md:py-12">
        <form
          onSubmit={enviar}
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
              A primeira cobrança de{' '}
              <strong className="font-semibold text-vm-navy-700 vm-num">{formatarReaisComCentavos(valorPlano)}</strong>{' '}
              acontece só depois de 30 dias. Avisamos 3 dias antes, e você pode cancelar quando quiser.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="teste-cpf">CPF</Label>
            <Input
              id="teste-cpf"
              inputMode="numeric"
              autoComplete="off"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => setCpf(formatarCpfCnpj(e.target.value).slice(0, 14))}
              aria-invalid={erro ? true : undefined}
              aria-describedby={erro ? 'teste-cpf-erro teste-cpf-ajuda' : 'teste-cpf-ajuda'}
              className="vm-num"
            />
            {erro && (
              <p id="teste-cpf-erro" role="alert" className="text-[13px] text-vm-burgundy-600">
                {erro}
              </p>
            )}
            <p id="teste-cpf-ajuda" className="text-[13px] leading-[18px] text-vm-ink-muted">
              Usamos o CPF só para criar a assinatura no Asaas. Ele não fica guardado conosco.
            </p>
          </div>

          <Button type="submit" size="lg" className="w-full text-base">
            Ativar teste grátis
          </Button>

          {conferido && (
            <p role="status" className="text-[13px] text-vm-ink-muted">
              CPF conferido. Esta tela ainda é só uma prévia: a ativação do teste grátis ainda não está ligada.
            </p>
          )}

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
      </main>
    </div>
  )
}
