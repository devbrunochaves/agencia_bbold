'use client'

import { useState, useEffect, useRef } from 'react'
import Icon from './FlowIcons'

const FORMATS     = ['Reels','Feed','Stories','Carrossel','Blog','Landing Page']
const PRIORITIES  = ['Baixa','Média','Alta','Urgente']
const RESPONSIBLES = ['Bruno','Ana Lima','Rafael Souza','Camila Rocha']
const EMPTY = {
  title:'', client:'', format:'Reels',
  responsible:'Ana Lima', deadline:'', priority:'Média',
  copy:'', observations:'',
}

export default function ApprovalModal({ isOpen, onClose, onSave, editing, clients = [] }) {
  const [form, setForm]     = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const firstRef            = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    setErrors({})
    setForm(editing ? {
      title:        editing.title        ?? '',
      client:       editing.client       ?? '',
      format:       editing.format       ?? 'Reels',
      responsible:  editing.responsible  ?? 'Ana Lima',
      deadline:     editing.deadline     ?? '',
      priority:     editing.priority     ?? 'Média',
      copy:         editing.copy         ?? '',
      observations: editing.observations ?? '',
    } : EMPTY)
    setTimeout(() => firstRef.current?.focus(), 80)
  }, [isOpen, editing])

  useEffect(() => {
    if (!isOpen) return
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [isOpen, onClose])

  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }))
  }

  function submit(e) {
    e.preventDefault()
    const errs = {}
    if (!form.title.trim()) errs.title = 'Título obrigatório'
    if (!form.client.trim()) errs.client = 'Cliente obrigatório'
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSave({ ...form })
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
              {editing ? 'Editar Aprovação' : 'Nova Aprovação'}
            </h2>
            <p style={{ fontSize:12, color:'#A1A1AA', margin:'3px 0 0' }}>
              {editing ? 'Atualize os dados da aprovação.' : 'Cadastre um conteúdo para revisão interna.'}
            </p>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, width:32, height:32, cursor:'pointer', color:'#A1A1AA', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Icon name="xmark" size={16}/>
          </button>
        </div>

        <form onSubmit={submit} style={{ padding:'20px 24px 24px', display:'flex', flexDirection:'column', gap:14 }}>
          {/* Título */}
          <Field label="Título do conteúdo *" error={errors.title}>
            <input ref={firstRef} className={`f-input ${errors.title ? 'has-error' : ''}`} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ex: Reels — Antes e Depois"/>
          </Field>

          <TwoCol>
            <Field label="Cliente *" error={errors.client}>
              <select className="f-select" value={form.client} onChange={e => set('client', e.target.value)}>
                {clients.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Formato">
              <select className="f-select" value={form.format} onChange={e => set('format', e.target.value)}>
                {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </Field>
          </TwoCol>

          <TwoCol>
            <Field label="Responsável">
              <select className="f-select" value={form.responsible} onChange={e => set('responsible', e.target.value)}>
                {RESPONSIBLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Prioridade">
              <select className="f-select" value={form.priority} onChange={e => set('priority', e.target.value)}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
          </TwoCol>

          <Field label="Prazo">
            <input className="f-input" type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)}/>
          </Field>

          <Field label="Legenda / Copy">
            <textarea className="f-input" value={form.copy} onChange={e => set('copy', e.target.value)} placeholder="Texto que será publicado..." rows={3} style={{ resize:'vertical', minHeight:72 }}/>
          </Field>

          <Field label="Observações internas">
            <textarea className="f-input" value={form.observations} onChange={e => set('observations', e.target.value)} placeholder="Anotações para a equipe de revisão..." rows={2} style={{ resize:'vertical', minHeight:56 }}/>
          </Field>

          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', paddingTop:16, borderTop:'1px solid rgba(255,255,255,0.07)' }}>
            <button type="button" className="f-btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="f-btn-primary">
              <Icon name={editing ? 'check' : 'plus'} size={14}/>
              {editing ? 'Salvar alterações' : 'Criar Aprovação'}
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
  return <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>{children}</div>
}
