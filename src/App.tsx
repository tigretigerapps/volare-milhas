import { BrowserRouter, Navigate, Route, Routes } from 'react-router'

import { Layout } from '@/components/Layout'
import { RotaAdmin } from '@/components/RotaAdmin'
import { RotaProtegida } from '@/components/RotaProtegida'
import { AlertasProvider } from '@/contexts/AlertasProvider'
import { AuthProvider } from '@/contexts/AuthProvider'
import { Admin } from '@/pages/Admin'
import { Assinar } from '@/pages/Assinar'
import { AtivarTeste } from '@/pages/AtivarTeste'
import { Cadastro } from '@/pages/Cadastro'
import { Conta } from '@/pages/Conta'
import { Entrar } from '@/pages/Entrar'
import { EsqueciSenha } from '@/pages/EsqueciSenha'
import { Home } from '@/pages/Home'
import { NovaSenha } from '@/pages/NovaSenha'
import { Privacidade } from '@/pages/Privacidade'
import { Resultados } from '@/pages/Resultados'
import { Rotas } from '@/pages/Rotas'
import { Termos } from '@/pages/Termos'

export default function App() {
  return (
    <AuthProvider>
      <AlertasProvider>
        <BrowserRouter>
          <Routes>
            {/* Tela própria, sem barra superior: só o visual aprovado, sem chamar serviço. */}
            <Route path="assinatura" element={<AtivarTeste />} />
            {/* Páginas de largura total: montam os próprios containers. */}
            <Route element={<Layout larguraTotal />}>
              <Route index element={<Home />} />
              <Route path="buscar" element={<Home />} />
              <Route path="buscar/resultados" element={<Resultados />} />
            </Route>
            <Route element={<Layout />}>
              <Route path="entrar" element={<Entrar />} />
              <Route path="cadastro" element={<Cadastro />} />
              <Route path="termos" element={<Termos />} />
              <Route path="privacidade" element={<Privacidade />} />
              <Route path="esqueci-senha" element={<EsqueciSenha />} />
              <Route path="nova-senha" element={<NovaSenha />} />
              <Route
                path="rotas"
                element={
                  <RotaProtegida>
                    <Rotas />
                  </RotaProtegida>
                }
              />
              <Route
                path="conta"
                element={
                  <RotaProtegida>
                    <Conta />
                  </RotaProtegida>
                }
              />
              <Route
                path="assinar"
                element={
                  <RotaProtegida>
                    <Assinar />
                  </RotaProtegida>
                }
              />
              <Route
                path="admin"
                element={
                  <RotaAdmin>
                    <Admin />
                  </RotaAdmin>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AlertasProvider>
    </AuthProvider>
  )
}
