import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { CalendarHeart, CalendarPlus, ChevronDown, MapPin, Stethoscope, Trash2 } from 'lucide-react'
import { db, type Appointment } from '../db'
import { appointmentToIcs, downloadFile } from '../lib/ics'
import { Button, Card, Empty, Fab, Input, Label, PageHeader, SectionTitle, Sheet, Textarea } from '../components/ui'

const empty = { title: '', doctor: '', place: '', at: '', questions: '', result: '' }

function DateTile({ at, dim }: { at: string; dim?: boolean }) {
  const d = new Date(at)
  return (
    <div className={`grid w-14 shrink-0 place-items-center rounded-2xl py-2 ${dim ? 'bg-surface-2 text-muted' : 'bg-gradient-to-br from-rose/25 to-violet/25 text-ink'}`}>
      <span className="text-[11px] font-semibold uppercase tracking-wide opacity-80">{d.toLocaleDateString('tr-TR', { month: 'short' })}</span>
      <span className="text-[22px] font-bold leading-none">{d.getDate()}</span>
      <span className="text-[11px] mt-0.5 opacity-80">{d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
    </div>
  )
}

function Item({ a, past, open, onToggle }: { a: Appointment; past?: boolean; open: boolean; onToggle: () => void }) {
  return (
    <Card className="p-3">
      <button className="flex w-full items-center gap-3 text-left" onClick={onToggle}>
        <DateTile at={a.at} dim={past} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[16px] truncate">{a.title}</p>
          {a.doctor && <p className="flex items-center gap-1 text-[13px] text-muted truncate"><Stethoscope size={13} /> {a.doctor}</p>}
          {a.place && <p className="flex items-center gap-1 text-[13px] text-muted truncate"><MapPin size={13} /> {a.place}</p>}
        </div>
        <ChevronDown size={18} className={`text-faint transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="mt-3 space-y-3 border-t border-line pt-3">
          <div>
            <Label>Doktora sorulacaklar</Label>
            <Textarea rows={3} placeholder="Soruları buraya yaz…" value={a.questions} onChange={e => db.appointments.update(a.id, { questions: e.target.value })} />
          </div>
          <div>
            <Label>Randevu notları</Label>
            <Textarea rows={4} placeholder="Doktorun söyledikleri, sonuçlar…" value={a.result} onChange={e => db.appointments.update(a.id, { result: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button variant="soft" className="flex-1" onClick={() => downloadFile('randevu.ics', appointmentToIcs(a), 'text/calendar')}>
              <CalendarPlus size={18} /> Takvim'e ekle
            </Button>
            <Button variant="soft" className="text-rose" aria-label="Sil" onClick={() => confirm('Randevu silinsin mi?') && db.appointments.delete(a.id)}>
              <Trash2 size={18} />
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

export default function Appointments() {
  const all = useLiveQuery(() => db.appointments.orderBy('at').toArray(), []) ?? []
  const [form, setForm] = useState(empty)
  const [sheet, setSheet] = useState(false)
  const [open, setOpen] = useState<number | null>(null)
  const now = new Date().toISOString().slice(0, 16)
  const upcoming = all.filter(a => a.at >= now)
  const past = all.filter(a => a.at < now).reverse()

  async function add() {
    if (!form.title.trim() || !form.at) return
    await db.appointments.add({ ...form } as never)
    setForm(empty); setSheet(false)
  }

  const set = (k: keyof typeof empty) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value })
  const toggle = (id: number) => setOpen(open === id ? null : id)

  return (
    <div className="space-y-3">
      <PageHeader
        subtitle={upcoming.length ? `${upcoming.length} yaklaşan` : 'Takvim'}
        title="Randevular"
        action={<Fab label="Randevu ekle" onClick={() => setSheet(true)} />}
      />

      {upcoming.length === 0 && (
        <Card><Empty icon={CalendarHeart} title="Yaklaşan randevu yok" text="Kontrol, ultrason ve tahlil randevularını ekle." /></Card>
      )}
      {upcoming.map(a => <Item key={a.id} a={a} open={open === a.id} onToggle={() => toggle(a.id)} />)}

      {past.length > 0 && <SectionTitle>Geçmiş</SectionTitle>}
      {past.map(a => <Item key={a.id} a={a} past open={open === a.id} onToggle={() => toggle(a.id)} />)}

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Yeni randevu">
        <div className="space-y-3">
          <div><Label>Başlık</Label><Input placeholder="20. hafta ultrason" value={form.title} onChange={set('title')} /></div>
          <div><Label>Tarih ve saat</Label><Input type="datetime-local" value={form.at} onChange={set('at')} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Doktor</Label><Input placeholder="Dr. …" value={form.doctor} onChange={set('doctor')} /></div>
            <div><Label>Yer</Label><Input placeholder="Hastane" value={form.place} onChange={set('place')} /></div>
          </div>
          <div><Label>Doktora sorulacaklar</Label><Textarea rows={3} value={form.questions} onChange={set('questions')} /></div>
          <Button className="w-full mt-2" onClick={add}>Kaydet</Button>
        </div>
      </Sheet>
    </div>
  )
}
