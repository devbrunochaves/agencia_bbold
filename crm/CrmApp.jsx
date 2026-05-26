import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Layout      from './components/Layout'
import Login       from './pages/Login'
import Dashboard   from './pages/Dashboard'
import Clientes    from './pages/Clientes'
import ClienteDetalhe from './pages/ClienteDetalhe'
import Contratos   from './pages/Contratos'
import Entregas    from './pages/Entregas'
import Demandas    from './pages/Demandas'
import Financeiro  from './pages/Financeiro'
import './styles/crm.css'

function ProtectedRoute({ session, children }) {
  if (!session) return <Navigate to="/crm/login" replace />
  return children
}

export default function CrmApp() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div className="crm-root">
      <div className="crm-loading-screen">
        <div className="crm-loading-spinner" />
        <p>Carregando CRM...</p>
      </div>
    </div>
  )

  return (
    <div className="crm-root">
      <Routes>
        <Route path="/crm/login" element={session ? <Navigate to="/crm/" replace /> : <Login />} />
        <Route path="/crm/*" element={
          <ProtectedRoute session={session}>
            <Layout session={session}>
              <Routes>
                <Route index element={<Dashboard />} />
                <Route path="clientes" element={<Clientes />} />
                <Route path="clientes/:id" element={<ClienteDetalhe />} />
                <Route path="demandas" element={<Demandas />} />
                <Route path="contratos" element={<Contratos />} />
                <Route path="entregas" element={<Entregas />} />
                <Route path="financeiro" element={<Financeiro />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/crm/" replace />} />
      </Routes>
    </div>
  )
}
