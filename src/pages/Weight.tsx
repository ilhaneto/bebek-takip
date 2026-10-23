import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { fmtDate, ymd } from '../lib/dates'

function Chart({ pts }: { pts: { date: string; kg: number }[] }) {
  if (pts.length < 2) return <p className="muted text-sm">Grafik için en az 2 kayıt gerekir.</p>
  const W = 320, H = 140, P = 24
  const kgs = pts.map(p => p.kg)
  const lo = Math.min(...kgs) - 1, hi = Math.max(...kgs) + 1
  const x = (i: number) => P + (i * (W - 2 * P)) / (pts.length - 1)
  const y = (kg: number) => H - P - ((kg - lo) / (hi - lo)) * (H - 2 * P)
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.kg)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <path d={d} fill="none" stroke="var(--brand)" strokeWidth="3" strokeLinejoin="round" />
      {pts.map((p, i) => <circle key={i} cx={x(i)} cy={y(p.kg)} r="4" fill="var(--brand)" />)}
      <text x={P} y={12} fontSize="11" fill="var(--muted)">{hi.toFixed(0)} kg</text>
      <text x={P} y={H - 6} fontSize="11" fill="var(--muted)">{lo.toFixed(0)} kg</text>
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

  const change = rows.length > 1 ? rows[rows.length - 1].kg - rows[0].kg : null

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Kilo Takibi</h1>
      <div className="card space-y-2">
        <div className="flex gap-2">
          <input className="input" inputMode="decimal" placeholder="Kilo (kg)" value={kg} onChange={e => setKg(e.target.value)} />
          <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <button className="btn w-full" onClick={add}>Kaydet</button>
      </div>
      <div className="card">
        <Chart pts={rows} />
        {change !== null && (
          <p className="text-sm mt-2">Toplam değişim: <b>{change > 0 ? '+' : ''}{change.toFixed(1)} kg</b></p>
        )}
      </div>
      {[...rows].reverse().map(r => (
        <div key={r.id} className="card flex justify-between items-center">
          <span>{fmtDate(r.date)}</span>
          <span className="flex items-center gap-3">
            <b>{r.kg} kg</b>
            <button className="muted text-sm" onClick={() => db.weights.delete(r.id)}>Sil</button>
          </span>
        </div>
      ))}
    </div>
  )
}
