// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ofertasExemplo } from '@/data/exemplo'
import { LinhaResultado } from './LinhaResultado'

afterEach(cleanup)
const oferta = ofertasExemplo[0]
const renderizar = (props: Partial<Parameters<typeof LinhaResultado>[0]> = {}) =>
  render(
    <ul>
      <LinhaResultado oferta={oferta} milheiro={20} {...props} />
    </ul>,
  )

describe('LinhaResultado: Quero essa oferta', () => {
  it('chama onQuero com a oferta', async () => {
    const onQuero = vi.fn()
    renderizar({ onQuero })
    await userEvent.click(screen.getByRole('button', { name: 'Quero essa oferta' }))
    expect(onQuero).toHaveBeenCalledWith(oferta)
  })

  it('desliga o botão enquanto envia', () => {
    renderizar({ lead: { tipo: 'enviando' } })
    expect(screen.getByRole('button', { name: 'Enviando…' })).toBeDisabled()
  })

  it('mostra a referência depois de enviado e avisa quando foi só um teste', () => {
    renderizar({ lead: { tipo: 'ok', referencia: 'VM-AB12CD34', simulado: true } })
    expect(screen.getByRole('button', { name: 'Pedido enviado' })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent('VM-AB12CD34')
    expect(screen.getByRole('status')).toHaveTextContent('nada foi enviado ao CRM')
  })

  it('mostra o erro e deixa tentar de novo', () => {
    renderizar({ lead: { tipo: 'erro', mensagem: 'Cadastre um telefone com DDD na página Conta.' } })
    expect(screen.getByRole('alert')).toHaveTextContent('telefone')
    expect(screen.getByRole('button', { name: 'Quero essa oferta' })).toBeEnabled()
  })
})

describe('LinhaResultado: régua e veredito', () => {
  it('descreve a régua numa frase só e esconde as barras', () => {
    renderizar()
    const regua = screen.getByRole('img')
    expect(regua.getAttribute('aria-label')?.replace(/\s/g, ' ')).toBe(
      'Dinheiro R$ 528, milhas 18.500 mais R$ 38, milhas economizam R$ 120',
    )
    regua.querySelectorAll(':scope > div > *').forEach((barra) => expect(barra).toHaveAttribute('aria-hidden', 'true'))
  })

  it('usa pts e mostra a taxa de resgate na Azul', () => {
    const azul = { ...oferta, companhia: 'Azul', programa: 'TudoAzul', taxaResgate: 40 }
    renderizar({ oferta: azul })
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('pontos')
    if (screen.queryByText(/economizam/)) expect(screen.getByText(/de taxa de resgate/)).toBeInTheDocument()
  })
})
