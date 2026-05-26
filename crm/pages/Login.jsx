import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('E-mail ou senha incorretos.')
    setLoading(false)
  }

  return (
    <div className="crm-login-wrap">
      <div className="crm-login-box">
        <div className="crm-login-logo">
          <h1>⚡ CRM</h1>
          <p>Acesso restrito — equipe interna</p>
        </div>

        {error && <div className="crm-login-error">{error}</div>}

        <form className="crm-login-form" onSubmit={handleLogin}>
          <div className="crm-form-group">
            <label>E-mail</label>
            <input
              className="crm-input"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="crm-form-group">
            <label>Senha</label>
            <input
              className="crm-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="crm-login-btn" type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
