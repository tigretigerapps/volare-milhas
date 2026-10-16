import { useEffect, useRef, useState } from 'react'

import { FormularioRota } from '@/components/FormularioRota'
import { LinhaRota } from '@/components/LinhaRota'
import { Button } from '@/components/ui/button'
import { useAlertas } from '@/contexts/useAlertas'
import { usePlano } from '@/hooks/usePlano'
import { useRotas } from '@/hooks/useRotas'
import { formularioVazio, rotaParaFormulario, type DadosRota } from '@/lib/rotas'

/** null: nenhum formulário aberto; "nova": criando; id: editando aquela rota. */
type Edicao = null | 'nova' | string

export function Rotas() {
  const { rotas, carregando, erroCarga, criar, atualizar, excluir } = useRotas()
  const { marcarVistos } = useAlertas()
  const { plano, limiteRotas } = usePlano()
  const [edicao, setEdicao] = useState<Edicao>(null)

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

  const rotaEditada = edicao && edicao !== 'nova' ? rotas.find((r) => r.id === edicao) : undefined

  const salvar = async (dados: DadosRota) => {
    const resultado = edicao === 'nova' ? await criar(dados) : await atualizar(edicao as string, dados)
    if (!resultado.erro) setEdicao(null)
    return resultado
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-medium">Minhas rotas</h1>
          <p className="mt-1 text-sm text-texto-secundario">
            Acompanhamos estas rotas e avisamos quando o preço chegar à sua meta.
          </p>
          {typeof limiteRotas === 'number' && (
            <p className="mt-1 text-sm tabular-nums text-texto-secundario" data-testid="uso-rotas">
              {limiteRotas === 0
                ? 'Sua assinatura não está ativa: não é possível criar rotas novas.'
                : `${ativas} de ${limiteRotas} rotas com alerta ativas${plano ? ` no plano ${plano.nome}` : ''}.`}
            </p>
          )}
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
        <p className="text-sm text-texto-secundario">Carregando suas rotas…</p>
      ) : erroCarga ? (
        <p role="alert" className="text-sm text-texto">
          {erroCarga}
        </p>
      ) : rotas.length === 0 ? (
        edicao === null && (
          <div className="flex flex-col items-start gap-3 border-y border-fio py-8">
            <p>Você ainda não monitora nenhuma rota.</p>
            <p className="text-sm text-texto-secundario">
              Escolha origem, destino, período e um preço-alvo. Quando aparecer uma oferta que bata a meta, você fica
              sabendo.
            </p>
            <Button onClick={() => setEdicao('nova')} disabled={semVaga}>
              Nova rota
            </Button>
          </div>
        )
      ) : (
        <section aria-label="Rotas monitoradas">
          <ul className="divide-y divide-fio border-y border-fio">
            {rotas.map((rota) => (
              <LinhaRota
                key={rota.id}
                rota={rota}
                onEditar={() => setEdicao(rota.id)}
                onAlternarAtivo={() => atualizar(rota.id, { ativo: !rota.ativo })}
                onExcluir={() => excluir(rota.id)}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
