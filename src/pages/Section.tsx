import type { ReactNode } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Segmented } from '../components/ui'

export interface Segment { value: string; label: string; element: ReactNode }

/** Alt menü sekmesi: başlık + bölümler arası geçiş. Adres: /<base>/<segment> */
export default function Section({ base, title, segments }: { base: string; title: string; segments: Segment[] }) {
  const { seg } = useParams()
  const nav = useNavigate()
  const current = segments.find(s => s.value === seg)
  if (!current) return <Navigate to={`/${base}/${segments[0].value}`} replace />

  return (
    <div className="space-y-4">
      <h1 className="pt-2 text-[30px] font-bold tracking-tight">{title}</h1>
      <Segmented items={segments} value={current.value} onChange={v => nav(`/${base}/${v}`, { replace: true })} />
      <div key={current.value}>{current.element}</div>
    </div>
  )
}
