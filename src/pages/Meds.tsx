import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { CalendarPlus, Check, Pill, Trash2 } from 'lucide-react'
import { db } from '../db'
import { ymd } from '../lib/dates'
import { downloadFile, medsToIcs } from '../lib/ics'
import { Button, Card, Empty, Fab, IconBadge, IconButton, Input, Label, PageHeader, SectionTitle, Sheet } from '../components/ui'

export default function Meds() {
  const meds = useLiveQuery(() => db.meds.toArray(), []) ?? []
  const today = ymd()
  const logs = useLiveQuery(() => db.medLogs.where('date').equals(today).toArray(), [today]) ?? []
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [dose, setDose] = useState('')
  const [times, setTimes] = useState('09:00')

  const taken = (medId: number, time: string) => logs.some(l => l.medId === medId && l.time === time)
  const total = meds.reduce((n, m) => n + m.times.length, 0)

  async function add() {
    const list = times.split(/[ ,]+/).filter(t => /^\d{1,2}:\d{2}$/.test(t)).map(t => t.padStart(5, '0'))
    if (!name.trim() || !list.length) return
    await db.meds.add({ name: name.trim(), dose: dose.trim(), times: list.sort(), active: true } as never)
    setName(''); setDose(''); setTimes('09:00'); setOpen(false)
  }

  async function toggle(medId: number, time: string) {
    const existing = logs.find(l => l.medId === medId && l.time === time)
    if (existing) await db.medLogs.delete(existing.id)
    else await db.medLogs.add({ medId, date: today, time, takenAt: Date.now() } as never)
  }

  return (
    <div className="space-y-3">
      <PageHeader
        subtitle={total ? `Bugün ${logs.length} / ${total} alındı` : 'Günlük takip'}
        title="İlaç & Vitamin"
        action={<Fab label="İlaç ekle" onClick={() => setOpen(true)} />}
      />

      {meds.length === 0 && (
        <Card><Empty icon={Pill} title="Henüz ilaç yok" text="Sağ üstteki + ile folik asit, demir gibi ilaçları ekle." /></Card>
      )}

      {meds.map(m => (
        <Card key={m.id}>
          <div className="flex items-center gap-3">
            <IconBadge icon={Pill} tone="rose" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[16px] truncate">{m.name}</p>
              {m.dose && <p className="text-[13px] text-muted">{m.dose}</p>}
            </div>
            <IconButton icon={Trash2} label="Sil" onClick={() => confirm(`${m.name} silinsin mi?`) && db.meds.delete(m.id)} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {m.times.map(t => {
              const on = taken(m.id, t)
              return (
                <button
                  key={t}
                  onClick={() => toggle(m.id, t)}
                  className={`flex items-center justify-center gap-1.5 h-12 rounded-2xl text-[15px] font-semibold border transition active:scale-95 ${
                    on ? 'bg-mint/15 border-mint/40 text-mint' : 'bg-surface-2 border-line text-ink'
                  }`}
                >
                  {on && <Check size={16} strokeWidth={3} />}
                  {t}
                </button>
              )
            })}
          </div>
        </Card>
      ))}

      {meds.length > 0 && (
        <>
          <SectionTitle>Hatırlatma</SectionTitle>
          <Button variant="soft" className="w-full" onClick={() => downloadFile('ilaclar.ics', medsToIcs(meds, today), 'text/calendar')}>
            <CalendarPlus size={18} /> iPhone Takvim'e ekle
          </Button>
          <p className="px-1 text-[12px] text-faint">Her ilaç saati için günlük tekrarlayan takvim hatırlatması oluşturur.</p>
        </>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="Yeni ilaç">
        <div className="space-y-3">
          <div><Label>Ad</Label><Input placeholder="Folik asit" value={name} onChange={e => setName(e.target.value)} /></div>
          <div><Label>Doz</Label><Input placeholder="1 tablet" value={dose} onChange={e => setDose(e.target.value)} /></div>
          <div><Label>Saatler (boşlukla ayır)</Label><Input inputMode="numeric" placeholder="09:00 21:00" value={times} onChange={e => setTimes(e.target.value)} /></div>
          <Button className="w-full mt-2" onClick={add}>Kaydet</Button>
        </div>
      </Sheet>
    </div>
  )
}
