import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { fmtDateTime, pregnancyWeek, ymd } from '../lib/dates'
import { exportBackup, importBackup } from '../lib/backup'

export default function Home() {
  const due = useLiveQuery(() => db.settings.get('dueDate'), [])?.value
  const meds = useLiveQuery(() => db.meds.toArray(), []) ?? []
  const today = ymd()
  const logs = useLiveQuery(() => db.medLogs.where('date').equals(today).toArray(), [today]) ?? []
  const next = useLiveQuery(
    () => db.appointments.where('at').above(new Date().toISOString().slice(0, 16)).first(),
    [],
  )
  const fileRef = useRef<HTMLInputElement>(null)

  const total = meds.reduce((n, m) => n + m.times.length, 0)
  const preg = due ? pregnancyWeek(due) : null

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Merhaba 👶</h1>

      <div className="card space-y-2">
        <div className="muted text-sm">Tahmini doğum tarihi</div>
        <input
          className="input"
          type="date"
          value={due ?? ''}
          onChange={e => db.settings.put({ key: 'dueDate', value: e.target.value })}
        />
        {preg && (
          <div className="text-lg">
            <b>{preg.week}. hafta {preg.day}. gün</b>
            <span className="muted"> · {preg.daysLeft > 0 ? `${preg.daysLeft} gün kaldı` : 'Süre geldi!'}</span>
          </div>
        )}
      </div>

      <Link to="/ilac" className="card block">
        <div className="muted text-sm">Bugünün ilaçları</div>
        <div className="text-lg font-semibold">{total === 0 ? 'İlaç eklenmedi' : `${logs.length} / ${total} alındı`}</div>
      </Link>

      <Link to="/randevu" className="card block">
        <div className="muted text-sm">Sıradaki randevu</div>
        <div className="text-lg font-semibold">{next ? next.title : 'Yaklaşan randevu yok'}</div>
        {next && <div className="muted text-sm">{fmtDateTime(next.at)}</div>}
      </Link>

      <div className="card space-y-2">
        <div className="muted text-sm">Yedek (verin sadece bu telefonda durur)</div>
        <div className="flex gap-2">
          <button className="btn-ghost flex-1" onClick={exportBackup}>Yedek al</button>
          <button className="btn-ghost flex-1" onClick={() => fileRef.current?.click()}>Yedek yükle</button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          hidden
          onChange={async e => {
            const f = e.target.files?.[0]
            if (f && confirm('Mevcut veriler silinip yedek yüklenecek. Emin misin?')) await importBackup(f)
            e.target.value = ''
          }}
        />
      </div>
    </div>
  )
}
