import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Appointment } from '../db'
import { fmtDateTime } from '../lib/dates'
import { appointmentToIcs, downloadFile } from '../lib/ics'

const empty = { title: '', doctor: '', place: '', at: '', questions: '', result: '' }

export default function Appointments() {
  const all = useLiveQuery(() => db.appointments.orderBy('at').toArray(), []) ?? []
  const [form, setForm] = useState(empty)
  const [open, setOpen] = useState<number | null>(null)
  const now = new Date().toISOString().slice(0, 16)
  const upcoming = all.filter(a => a.at >= now)
  const past = all.filter(a => a.at < now).reverse()

  async function add() {
    if (!form.title.trim() || !form.at) return
    await db.appointments.add({ ...form } as never)
    setForm(empty)
  }

  const set = (k: keyof typeof empty) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value })

  const Item = ({ a }: { a: Appointment }) => (
    <div className="card space-y-2">
      <button className="w-full text-left" onClick={() => setOpen(open === a.id ? null : a.id)}>
        <div className="font-semibold">{a.title}</div>
        <div className="muted text-sm">{fmtDateTime(a.at)}{a.doctor && ` · ${a.doctor}`}{a.place && ` · ${a.place}`}</div>
      </button>
      {open === a.id && (
        <div className="space-y-2">
          <label className="text-sm muted">Doktora sorulacaklar</label>
          <textarea className="input" rows={3} value={a.questions} onChange={e => db.appointments.update(a.id, { questions: e.target.value })} />
          <label className="text-sm muted">Randevu notları / doktorun söyledikleri</label>
          <textarea className="input" rows={4} value={a.result} onChange={e => db.appointments.update(a.id, { result: e.target.value })} />
          <div className="flex gap-2">
            <button className="btn-ghost flex-1" onClick={() => downloadFile('randevu.ics', appointmentToIcs(a), 'text/calendar')}>📅 Takvim'e ekle</button>
            <button className="btn-ghost" onClick={() => confirm('Randevu silinsin mi?') && db.appointments.delete(a.id)}>Sil</button>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Randevular</h1>
      <div className="card space-y-2">
        <h2 className="font-semibold">Yeni randevu</h2>
        <input className="input" placeholder="Başlık (ör. 20. hafta ultrason)" value={form.title} onChange={set('title')} />
        <input className="input" type="datetime-local" value={form.at} onChange={set('at')} />
        <input className="input" placeholder="Doktor" value={form.doctor} onChange={set('doctor')} />
        <input className="input" placeholder="Yer / hastane" value={form.place} onChange={set('place')} />
        <textarea className="input" rows={2} placeholder="Doktora sorulacaklar" value={form.questions} onChange={set('questions')} />
        <button className="btn w-full" onClick={add}>Ekle</button>
      </div>

      <h2 className="font-semibold">Yaklaşan</h2>
      {upcoming.length === 0 && <p className="muted">Yaklaşan randevu yok.</p>}
      {upcoming.map(a => <Item key={a.id} a={a} />)}

      {past.length > 0 && <h2 className="font-semibold">Geçmiş</h2>}
      {past.map(a => <Item key={a.id} a={a} />)}
    </div>
  )
}
