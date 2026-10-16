import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'
import { ConfiguracaoAusente } from '@/components/ConfiguracaoAusente'
import { supabaseConfigurado } from '@/lib/ambiente'

const raiz = createRoot(document.getElementById('root')!)

if (supabaseConfigurado(import.meta.env)) {
  // O app é carregado só aqui: o cliente do Supabase falha ao ser importado sem as variáveis,
  // o que deixaria a tela em branco em vez de explicar o problema.
  import('./App').then(({ default: App }) => {
    raiz.render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
} else {
  raiz.render(<ConfiguracaoAusente />)
}
