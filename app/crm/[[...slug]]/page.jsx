'use client'
import { BrowserRouter } from 'react-router-dom'
import CrmApp from '../../../crm/CrmApp'

export default function CrmPage() {
  return (
    <BrowserRouter>
      <CrmApp />
    </BrowserRouter>
  )
}
