import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'

import { CampoTexto } from '@/components/CampoTexto'
import { FormularioAuth } from '@/components/FormularioAuth'
import { Button } from '@/components/ui/button'
import { supabase } from '@/integrations/supabase/client'
import { traduzirErroAuth } from '@/lib/erros-auth'

const classeLink = 'text-texto underline underline-offset-4 decoration-fio hover:decoration-texto'

export function EsqueciSenha() {
  const [email, setEmail] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [enviadoPara, setEnviadoPara] = useState<string | null>(null)

  if (enviadoPara) {
    return (
      <div className="mx-auto w-full max-w-sm">
        <h1 className="font-display text-2xl font-medium">Confira seu e-mail</h1>
        <p className="mt-2 text-texto-secundario">
          Se existir uma conta com <span className="font-normal text-texto">{enviadoPara}</span>, enviamos um link para
          criar uma nova senha. Ele vale por pouco tempo.
        </p>
        <Button asChild variant="contorno" className="mt-6">
          <Link to="/entrar">Voltar para entrar</Link>
        </Button>
      </div>
    )
  }

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault()
    const endereco = email.trim()
    if (!endereco) {
      setErro('Informe o e-mail da sua conta.')
      return
    }
    setEnviando(true)
    setErro(null)
    const { error } = await supabase.auth.resetPasswordForEmail(endereco, {
      redirectTo: `${window.location.origin}/nova-senha`,
    })
    setEnviando(false)
    if (error) {
      setErro(traduzirErroAuth(error))
      return
    }
    // Mesma resposta exista a conta ou não, para não revelar quem é cliente.
    setEnviadoPara(endereco)
  }

  return (
    <FormularioAuth
      titulo="Esqueci minha senha"
      subtitulo="Informe seu e-mail e enviaremos um link para criar uma nova senha."
      onSubmit={enviar}
      erro={erro}
      rodape={
        <Link to="/entrar" className={classeLink}>
          Voltar para entrar
        </Link>
      }
    >
      <CampoTexto
        id="esqueci-email"
        rotulo="E-mail"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Button type="submit" disabled={enviando}>
        {enviando ? 'Enviando…' : 'Enviar link'}
      </Button>
    </FormularioAuth>
  )
}
