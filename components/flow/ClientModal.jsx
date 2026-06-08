'use client'

import { useState, useEffect, useRef } from 'react'
import Icon from './FlowIcons'

const PLANS    = ['Start', 'Growth', 'Premium', 'Custom']
const STATUSES = ['Ativo', 'Em onboarding', 'Pausado']

const EMPTY = {
  name: '', niche: '', plan: 'Growth', responsible: '',
  status: 'Ativo', contents: 10, instagram: '', whatsapp: '', email: '', observations: '',
}

export default function ClientModal({ isOpen, onClose, onSave, editingClient }) {
  const [form,        setForm]        = useState(EMPTY)
  const [errors,      setErrors]      = useState({})
  const [teamMembers, setTeamMembers] = useState([])
  const firstRef = useRef(null)

  // Load team from localStorage + reset form when modal opens
  useEffect(() => {
    if (!isOpen) return
    setErrors({})

    let active = []
    try {
      const stored = JSON.parse(localStorage.getItem('bbold_flow_team')) ?? []
      active = stored.filter(m => m.status === 'Ativo')
    } catch {}
    setTeamMembers(active)

    const defaultResp = active[0]?.name ?? ''

    if (editingClient) {
      setForm({
        name:         editingClient.name         ?? '',
        niche:        editingClient.niche        ?? '',
        plan:         editingClient.plan         ?? 'Growth',
        responsible:  editingClient.responsible  ?? defaultResp,
        status:       editingClient.status       ?? 'Ativo',
        contents:     editingClient.contents     ?? 10,
        instagram:    editingClient.instagram    ?? '',
        whatsapp:     editingClient.whatsapp     ?? '',
        email:        editingClient.email        ?? '',
        observations: editingClient.observations ?? '',
      })
    } else {
      setForm({ ...EMPTY, responsible: defaultResp })
    }
    setTimeout(() => firstRef.current?.focus(), 80)
  }, [isOpen, editingClient])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }))
  }

  function validate() {
    const e = {}
    if (!form.name.trim())  e.name  = 'Nome obrigatório'
    if (!form.niche.trim()) e.niche = 'Nicho obrigatório'
    return e
  }

  function submit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSave({ ...form, contents: Number(form.contents) || 0 })
  }

  if (!isOpen) return null

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', backdropFilter:'blur(5px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16, animation:'overlayIn 0.18s ease' }}
      onClick={onClose}
    >
      <div
        style={{ width:'100%', maxWidth:580, maxHeight:'92vh', overflowY:'auto', background:'#232323', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, boxShadow:'0 32px 96px rgba(0,0,0,0.7)', animation:'modalIn 0.22s cubic-bezier(.4,0,.2,1)', scrollbarWidth:'thin' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding:'22px 24px 16px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, position:'sticky', top:0, background:'#232323', zIndex:1 }}>
          <div>
            <h2 style={{ fontSize:17, fontWeight:700, color:'#fff', margin:0 }}>
              {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
            </h2>
            <p style={{ fontSize:12, color:'#A1A1AA', margin:'3px 0 0' }}>
              {editingClient ? 'Atualize as informações do cliente.' : 'Preencha os dados para cadastrar um novo cliente.'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, width:32, height:32, cursor:'pointer', color:'#A1A1AA', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'background 0.15s' }}
          >
            <Icon name="xmark" size={16}/>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={submit} style={{ padding:'20px 24px 24px', display:'flex', flexDirection:'column', gap:16 }}>
          {/* Nome */}
          <Field label="Nome do cliente *" error={errors.name}>
            <input
              ref={firstRef}
              className={`f-input ${errors.name ? 'has-error' : ''}`}
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Ex: Academia Alpha"
            />
          </Field>

          {/* Nicho + Plano */}
          <TwoCol>
            <Field label="Nicho *" error={errors.niche}>
              <input
                className={`f-input ${errors.niche ? 'has-error' : ''}`}
                value={form.niche}
                onChange={e => set('niche', e.target.value)}
                placeholder="Ex: Fitness & Academia"
              />
            </Field>
            <Field label="Plano contratado">
              <select className="f-select" value={form.plan} onChange={e => set('plan', e.target.value)}>
                {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
          </TwoCol>

          {/* Responsável + Status */}
          <TwoCol>
            <Field label="Responsável interno">
              <select className="f-select" value={form.responsible} onChange={e => set('responsible', e.target.value)}>
                {teamMembers.length === 0
                  ? <option value="">Nenhum membro cadastrado</option>
                  : teamMembers.map(m => <option key={m.name} value={m.name}>{m.name}</option>)
                }
                {form.responsible && !teamMembers.find(m => m.name === form.responsible) && (
                  <option value={form.responsible}>{form.responsible}</option>
                )}
              </select>
            </Field>
            <Field label="Status">
              <select className="f-select" value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </TwoCol>

          {/* Conteúdos + Email */}
          <TwoCol>
            <Field label="Conteúdos por mês">
              <input
                className="f-input"
                type="number"
                min="0"
                max="999"
                value={form.contents}
                onChange={e => set('contents', e.target.value)}
              />
            </Field>
            <Field label="E-mail">
              <input
                className="f-input"
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="email@cliente.com"
              />
            </Field>
          </TwoCol>

          {/* Instagram + WhatsApp */}
          <TwoCol>
            <Field label="Instagram">
              <input
                className="f-input"
                value={form.instagram}
                onChange={e => set('instagram', e.target.value)}
                placeholder="@handle"
              />
            </Field>
            <Field label="WhatsApp">
              <input
                className="f-input"
                value={form.whatsapp}
                onChange={e => set('whatsapp', e.target.value)}
                placeholder="(11) 99999-0000"
              />
            </Field>
          </TwoCol>

          {/* Observações */}
          <Field label="Observações">
            <textarea
              className="f-input"
              value={form.observations}
              onChange={e => set('observations', e.target.value)}
              placeholder="Anotações internas sobre o cliente..."
              rows={3}
              style={{ resize:'vertical', minHeight:72 }}
            />
          </Field>

          {/* Footer */}
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:4, paddingTop:16, borderTop:'1px solid rgba(255,255,255,0.07)' }}>
            <button type="button" className="f-btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="f-btn-primary">
              <Icon name={editingClient ? 'check' : 'plus'} size={14}/>
              {editingClient ? 'Salvar alterações' : 'Salvar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="f-field-label">{label}</label>
      {children}
      {error && <span className="f-field-error">{error}</span>}
    </div>
  )
}

function TwoCol({ children }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
      {children}
    </div>
  )
}
