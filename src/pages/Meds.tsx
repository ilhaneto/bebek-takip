import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { ymd } from '../lib/dates'
import { downloadFile, medsToIcs } from '../lib/ics'

export default function Meds() {
  const meds = useLiveQuery(() => db.meds.toArray(), []) ?? []
  const today = ymd()
  const logs = useLiveQuery(() => db.medLogs.where('date').equals(today).toArray(), [today]) ?? []
  const [name, setName] = useState('')
  const [dose, setDose] = useState('')
  const [times, setTimes] = useState('09:00')

  const taken = (medId: number, time: string) => logs.some(l => l.medId === medId && l.time === time)

  async function add() {
    const list = times.split(/[ ,]+/).filter(t => /^\d{1,2}:\d{2}$/.test(t)).map(t => t.padStart(5, '0'))
    if (!name.trim() || !list.length) return
    await db.meds.add({ name: name.trim(), dose: dose.trim(), times: list.sort(), active: true } as never)
    setName(''); setDose(''); setTimes('09:00')
  }

  async function toggle(medId: number, time: string) {
    const existing = logs.find(l => l.medId === medId && l.time === time)
    if (existing) await db.medLogs.delete(existing.id)
    else await db.medLogs.add({ medId, date: today, time, takenAt: Date.now() } as never)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">İlaç & Vitamin</h1>

      {meds.length === 0 && <p className="muted">Henüz ilaç eklenmedi.</p>}
      {meds.map(m => (
        <div key={m.id} className="card space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-semibold">{m.name}</div>
              <div className="muted text-sm">{m.dose}</div>
            </div>
            <button className="muted text-sm" onClick={() => confirm(`${m.name} silinsin mi?`) && db.meds.delete(m.id)}>Sil</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {m.times.map(t => (
              <button
                key={t}
                onClick={() => toggle(m.id, t)}
                className={taken(m.id, t) ? 'btn' : 'btn-ghost'}
              >
                {taken(m.id, t) ? '✓ ' : ''}{t}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="card space-y-2">
        <h2 className="font-semibold">Yeni ilaç</h2>
        <input className="input" placeholder="Ad (ör. Folik asit)" value={name} onChange={e => setName(e.target.value)} />
        <input className="input" placeholder="Doz (ör. 1 tablet)" value={dose} onChange={e => setDose(e.target.value)} />
        <input className="input" placeholder="Saatler (ör. 09:00 21:00)" value={times} onChange={e => setTimes(e.target.value)} />
        <button className="btn w-full" onClick={add}>Ekle</button>
      </div>

      {meds.length > 0 && (
        <button
          className="btn-ghost w-full"
          onClick={() => downloadFile('ilaclar.ics', medsToIcs(meds, today), 'text/calendar')}
        >
          📅 iPhone Takvim'e hatırlatma ekle (.ics)
        </button>
      )}
    </div>
  )
}
