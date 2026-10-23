import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Scale, Trash2, TrendingDown, TrendingUp } from 'lucide-react'
import { db } from '../db'
import { fmtDate, ymd } from '../lib/dates'
import { Button, Card, Empty, IconButton, Input, Label, PageHeader, SectionTitle } from '../components/ui'

function Chart({ pts }: { pts: { date: string; kg: number }[] }) {
  if (pts.length < 2) return <p className="text-sm text-muted py-6 text-center">Grafik için en az 2 kayıt gerekir.</p>
  const W = 340, H = 150, P = 8
  const kgs = pts.map(p => p.kg)
  const lo = Math.min(...kgs) - 0.5, hi = Math.max(...kgs) + 0.5
  const x = (i: number) => P + (i * (W - 2 * P)) / (pts.length - 1)
  const y = (kg: number) => P + (1 - (kg - lo) / (hi - lo)) * (H - 2 * P)
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.kg)}`).join(' ')
  const area = `${line} L${x(pts.length - 1)},${H} L${x(0)},${H} Z`
  const last = pts[pts.length - 1]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible">
      <defs>
        <linearGradient id="wl" x1="0" x2="1"><stop offset="0" stopColor="#ff7a9c" /><stop offset="1" stopColor="#a78bfa" /></linearGradient>
        <linearGradient id="wa" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#a78bfa" stopOpacity="0.35" /><stop offset="1" stopColor="#a78bfa" stopOpacity="0" /></linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map(f => <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="#2a2635" strokeDasharray="3 5" />)}
      <path d={area} fill="url(#wa)" />
      <path d={line} fill="none" stroke="url(#wl)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(pts.length - 1)} cy={y(last.kg)} r="6" fill="#0b0a10" stroke="#a78bfa" strokeWidth="3" />
    </svg>
  )
}

export default function Weight() {
  const rows = useLiveQuery(() => db.weights.orderBy('date').toArray(), []) ?? []
  const [kg, setKg] = useState('')
  const [date, setDate] = useState(ymd())

  async function add() {
    const v = parseFloat(kg.replace(',', '.'))
    if (!v || v < 20 || v > 250) return
    await db.weights.add({ date, kg: v } as never)
    setKg('')
  }

  const last = rows[rows.length - 1]
  const change = rows.length > 1 ? last.kg - rows[0].kg : null
  const Trend = change !== null && change < 0 ? TrendingDown : TrendingUp

  return (
    <div className="space-y-3">
      <PageHeader subtitle="Gebelik boyunca" title="Kilo Takibi" />

      <Card className="p-5">
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-[13px] text-muted">Son ölçüm</p>
            <p className="text-[34px] font-bold leading-none mt-1">
              {last ? last.kg.toLocaleString('tr-TR') : '—'}<span className="text-[16px] text-muted font-medium ml-1">kg</span>
            </p>
          </div>
          {change !== null && (
            <span className="flex items-center gap-1 rounded-full bg-violet/15 text-violet px-3 py-1.5 text-[13px] font-semibold">
              <Trend size={15} /> {change > 0 ? '+' : ''}{change.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} kg
            </span>
          )}
        </div>
        {rows.length ? <Chart pts={rows} /> : <Empty icon={Scale} title="Henüz ölçüm yok" text="İlk kilonu aşağıdan ekle." />}
      </Card>

      <Card>
        <div className="grid grid-cols-2 gap-2">
          <div><Label>Kilo (kg)</Label><Input inputMode="decimal" placeholder="64,5" value={kg} onChange={e => setKg(e.target.value)} /></div>
          <div><Label>Tarih</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
        </div>
        <Button className="w-full mt-3" onClick={add}>Kaydet</Button>
      </Card>

      {rows.length > 0 && <SectionTitle>Geçmiş</SectionTitle>}
      {rows.length > 0 && (
        <Card className="p-1.5">
          {[...rows].reverse().map((r, i) => (
            <div key={r.id} className={`flex items-center justify-between px-3 py-2.5 ${i ? 'border-t border-line' : ''}`}>
              <span className="text-[15px] text-muted">{fmtDate(r.date)}</span>
              <span className="flex items-center gap-1">
                <b className="text-[15px]">{r.kg.toLocaleString('tr-TR')} kg</b>
                <IconButton icon={Trash2} label="Sil" className="-my-2" onClick={() => db.weights.delete(r.id)} />
              </span>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
