'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) {
      setError('E-mail ou senha incorretos.')
      return
    }
    router.push('/flow')
    router.refresh()
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#181818',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      fontFamily: "var(--font-barlow, 'Inter', system-ui, sans-serif)",
    }}>
      {/* Background grid */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />

      <div style={{ width: '100%', maxWidth: 400, position: 'relative' }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 36 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: '#FFD22E',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 900, color: '#000',
            boxShadow: '0 0 24px rgba(255,210,46,0.35)',
            marginBottom: 14,
          }}>B</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
            BBOLD <span style={{ color: '#FFD22E' }}>Flow</span>
          </div>
          <div style={{ fontSize: 13, color: '#A1A1AA', marginTop: 4 }}>
            Acesse sua conta
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: '#2A2A2A',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          padding: '32px 28px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{
                display: 'block', fontSize: 11, fontWeight: 700,
                color: '#71717A', textTransform: 'uppercase',
                letterSpacing: '0.07em', marginBottom: 7,
              }}>E-mail</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                style={{
                  width: '100%', padding: '11px 14px', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${error ? '#EF4444' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 10, color: '#fff', fontSize: 14,
                  fontFamily: 'inherit', outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => { e.target.style.borderColor = 'rgba(255,210,46,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(255,210,46,0.08)' }}
                onBlur={e => { e.target.style.borderColor = error ? '#EF4444' : 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            <div>
              <label style={{
                display: 'block', fontSize: 11, fontWeight: 700,
                color: '#71717A', textTransform: 'uppercase',
                letterSpacing: '0.07em', marginBottom: 7,
              }}>Senha</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '11px 14px', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${error ? '#EF4444' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 10, color: '#fff', fontSize: 14,
                  fontFamily: 'inherit', outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => { e.target.style.borderColor = 'rgba(255,210,46,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(255,210,46,0.08)' }}
                onBlur={e => { e.target.style.borderColor = error ? '#EF4444' : 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 8, padding: '10px 14px', fontSize: 13,
                color: '#FCA5A5', display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 15 }}>⚠</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 4, padding: '12px 0', width: '100%',
                background: loading ? 'rgba(255,210,46,0.6)' : '#FFD22E',
                border: 'none', borderRadius: 10,
                color: '#000', fontSize: 14, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', transition: 'opacity 0.15s',
                boxShadow: '0 0 20px rgba(255,210,46,0.25)',
              }}
            >
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#52525B' }}>
          Acesso restrito à equipe BBOLD
        </div>
      </div>
    </div>
  )
}
