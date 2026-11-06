import { useEffect, useRef, useState } from 'react'

import { FormularioRota } from '@/components/FormularioRota'
import { LinhaRota } from '@/components/LinhaRota'
import { Button } from '@/components/ui/button'
import { useAlertas } from '@/contexts/useAlertas'
import { usePlano } from '@/hooks/usePlano'
import { useRotas } from '@/hooks/useRotas'
import { diasAlertaRecente, type AlertaPrecoAlvo } from '@/lib/alertas'
import { hojeISO } from '@/lib/datas'
import { formularioVazio, rotaParaFormulario, type DadosRota } from '@/lib/rotas'

/** null: nenhum formulário aberto; "nova": criando; id: editando aquela rota. */
type Edicao = null | 'nova' | string

export function Rotas() {
  const { rotas, carregando, erroCarga, criar, atualizar, excluir } = useRotas()
  const { alertas, marcarVistos } = useAlertas()
  const { plano, limiteRotas } = usePlano()
  const [edicao, setEdicao] = useState<Edicao>(null)
  // "Agora" fixo ao abrir a tela: o estado da rota não muda sozinho a cada renderização.
  const [abertaEm] = useState(() => Date.now())

  const formulario = useRef<HTMLDivElement>(null)

  // Abrir esta tela é "ver os alertas": zera o badge da barra superior.
  useEffect(() => {
    marcarVistos()
  }, [marcarVistos])

  // Ao abrir o formulário (inclusive editando uma rota lá embaixo), leva o usuário até ele.
  useEffect(() => {
    if (edicao !== null) formulario.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  }, [edicao])

  const ativas = rotas.filter((r) => r.ativo).length
  const semVaga = typeof limiteRotas === 'number' && ativas >= limiteRotas

  // Alerta recente de cada rota (o mais novo), de voo que ainda não passou: a rota "chegou ao preço-alvo".
  const hoje = hojeISO()
  const limiteRecente = abertaEm - diasAlertaRecente * 86_400_000
  const alertaPorRota = new Map<string, AlertaPrecoAlvo>()
  for (const alerta of alertas) {
    if (!alerta.rotaId || alertaPorRota.has(alerta.rotaId)) continue
    if (Date.parse(alerta.enviadoEm) < limiteRecente) continue
    if (alerta.dataVoo && alerta.dataVoo < hoje) continue
    alertaPorRota.set(alerta.rotaId, alerta)
  }

  const vagas = typeof limiteRotas === 'number' ? Math.max(limiteRotas - ativas, 0) : null

  const rotaEditada = edicao && edicao !== 'nova' ? rotas.find((r) => r.id === edicao) : undefined

  const salvar = async (dados: DadosRota) => {
    const resultado = edicao === 'nova' ? await criar(dados) : await atualizar(edicao as string, dados)
    if (!resultado.erro) setEdicao(null)
    return resultado
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-[720px]">
          <h1 className="text-2xl font-semibold leading-[30px] md:text-heading-l">Minhas rotas</h1>
          <p className="mt-2 text-vm-ink-muted">
            {limiteRotas === 0 ? (
              <span data-testid="uso-rotas">Sua assinatura não está ativa: não é possível criar rotas novas.</span>
            ) : (
              <>
                {typeof limiteRotas === 'number' && (
                  <span data-testid="uso-rotas" className="vm-num">
                    {ativas} de {limiteRotas} rotas com alerta{plano ? ` no plano ${plano.nome}` : ''}.{' '}
                  </span>
                )}
                Conferimos todas uma vez por dia e avisamos você quando o preço chega na sua meta.
              </>
            )}
          </p>
        </div>
        {edicao === null && rotas.length > 0 && (
          <Button onClick={() => setEdicao('nova')} disabled={semVaga}>
            Nova rota
          </Button>
        )}
      </div>

      {edicao !== null && (
        <div ref={formulario} className="scroll-mt-4">
          <FormularioRota
            // A key reinicia o formulário ao trocar de rota editada.
            key={edicao}
            titulo={edicao === 'nova' ? 'Nova rota' : 'Editar rota'}
            inicial={rotaEditada ? rotaParaFormulario(rotaEditada) : formularioVazio}
            onSalvar={salvar}
            onCancelar={() => setEdicao(null)}
          />
        </div>
      )}

      {carregando ? (
        <p className="text-sm text-vm-ink-muted">Carregando suas rotas…</p>
      ) : erroCarga ? (
        <p role="alert" className="text-sm text-vm-burgundy-600">
          {erroCarga}
        </p>
      ) : rotas.length === 0 ? (
        edicao === null && (
          <div className="flex flex-col items-start gap-4 rounded-vm-md bg-vm-surface-card p-6">
            <p className="max-w-[560px]">
              Você ainda não salvou nenhuma rota. Salve uma rota e avisamos quando o preço chegar na sua meta.
            </p>
            <Button onClick={() => setEdicao('nova')} disabled={semVaga}>
              Nova rota
            </Button>
          </div>
        )
      ) : (
        <section aria-label="Rotas monitoradas" className="flex flex-col gap-3 md:block md:overflow-hidden md:rounded-vm-md md:bg-vm-surface-card">
          <ul className="flex flex-col gap-3 md:block">
            {rotas.map((rota) => (
              <LinhaRota
                key={rota.id}
                rota={rota}
                alerta={alertaPorRota.get(rota.id) ?? null}
                onEditar={() => setEdicao(rota.id)}
                onAlternarAtivo={() => atualizar(rota.id, { ativo: !rota.ativo })}
                onExcluir={() => excluir(rota.id)}
              />
            ))}
          </ul>
          {limiteRotas !== 0 && limiteRotas !== undefined && (
            <div className="flex flex-wrap items-center gap-4 rounded-vm-md bg-vm-surface-page p-4 md:rounded-none md:p-6">
              <p className="min-w-0 flex-1 basis-64 text-sm text-vm-ink-muted">
                {vagas === 0
                  ? `Você atingiu o limite de ${limiteRotas} ${limiteRotas === 1 ? 'rota' : 'rotas'} do seu plano.`
                  : `${vagas === null ? 'Você pode salvar mais rotas.' : `Você ainda pode salvar mais ${vagas} ${vagas === 1 ? 'rota' : 'rotas'}.`} Escolha um período e um preço-alvo em milhas, em reais ou nos dois.`}
              </p>
              {vagas !== 0 && edicao === null && (
                <Button variant="contorno" size="sm" className="h-11 md:h-[38px]" onClick={() => setEdicao('nova')}>
                  Salvar nova rota
                </Button>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
