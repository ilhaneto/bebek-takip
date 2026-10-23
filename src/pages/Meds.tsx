import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Bell, CalendarPlus, Check, Pencil, Pill, Repeat, Trash2 } from 'lucide-react'
import { db, type Med, type Schedule } from '../db'
import { fmtDate, ymd } from '../lib/dates'
import { downloadFile, medsToIcs } from '../lib/ics'
import { DEFAULT_REMIND, WEEK, firstDueFrom, isDueOn, remindLabel, scheduleLabel, scheduleOf } from '../lib/schedule'
import { Button, Card, Chip, Empty, Fab, IconBadge, IconButton, Input, Label, PageHeader, SectionTitle, Sheet } from '../components/ui'

type RepeatType = Schedule['type']
const REMIND_OPTIONS = [0, 15, 30, 60]

function MedCard({ m, today, taken, onToggle, onEdit }: { m: Med; today: string; taken: (t: string) => boolean; onToggle: (t: string) => void; onEdit: () => void }) {
  const due = isDueOn(m, today)
  return (
    <Card className={due ? '' : 'opacity-70'}>
      <div className="flex items-center gap-3">
        <IconBadge icon={Pill} tone={due ? 'rose' : 'violet'} />
        <button className="flex-1 min-w-0 text-left" onClick={onEdit}>
          <p className="font-semibold text-[16px] truncate">{m.name}</p>
          {m.dose && <p className="text-[13px] text-muted truncate">{m.dose}</p>}
        </button>
        <IconButton
          icon={CalendarPlus}
          label="Takvime ekle"
          onClick={() => downloadFile(`${m.name}.ics`, medsToIcs([m], today), 'text/calendar')}
        />
        <IconButton icon={Pencil} label="Düzenle" onClick={onEdit} />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-muted">
        <span className="flex items-center gap-1"><Repeat size={13} /> {scheduleLabel(m)}</span>
        <span className="flex items-center gap-1"><Bell size={13} /> {remindLabel(m.remindBefore ?? DEFAULT_REMIND)}</span>
        {!due && <span className="text-violet">Sıradaki: {fmtDate(firstDueFrom(m, today))}</span>}
      </div>
      {due && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {m.times.map(t => {
            const on = taken(t)
            return (
              <button
                key={t}
                onClick={() => onToggle(t)}
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
      )}
    </Card>
  )
}

export default function Meds() {
  const meds = useLiveQuery(() => db.meds.toArray(), []) ?? []
  const today = ymd()
  const logs = useLiveQuery(() => db.medLogs.where('date').equals(today).toArray(), [today]) ?? []
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Med | null>(null)
  const [name, setName] = useState('')
  const [dose, setDose] = useState('')
  const [times, setTimes] = useState('09:00')
  const [repeat, setRepeat] = useState<RepeatType>('daily')
  const [days, setDays] = useState<number[]>([])
  const [every, setEvery] = useState('2')
  const [start, setStart] = useState(today)
  const [remind, setRemind] = useState(DEFAULT_REMIND)

  const dueToday = meds.filter(m => isDueOn(m, today))
  const others = meds.filter(m => !isDueOn(m, today))
  const total = dueToday.reduce((n, m) => n + m.times.length, 0)
  const takenCount = logs.filter(l => dueToday.some(m => m.id === l.medId)).length

  function reset() {
    setName(''); setDose(''); setTimes('09:00'); setRepeat('daily'); setDays([]); setEvery('2'); setStart(today); setRemind(DEFAULT_REMIND)
  }

  function openNew() {
    reset(); setEditing(null); setOpen(true)
  }

  function openEdit(m: Med) {
    const s = scheduleOf(m)
    setName(m.name); setDose(m.dose); setTimes(m.times.join(' ')); setRepeat(s.type)
    setDays(s.type === 'weekly' ? s.days : [])
    setEvery(s.type === 'interval' ? String(s.every) : '2')
    setStart(s.type === 'interval' ? s.start : today)
    setRemind(m.remindBefore ?? DEFAULT_REMIND)
    setEditing(m); setOpen(true)
  }

  async function remove() {
    if (!editing || !confirm(`${editing.name} silinsin mi?`)) return
    await db.medLogs.where('medId').equals(editing.id).delete()
    await db.meds.delete(editing.id)
    setOpen(false)
  }

  async function save() {
    const list = times.split(/[ ,]+/).filter(t => /^\d{1,2}[:.]\d{2}$/.test(t)).map(t => t.replace('.', ':').padStart(5, '0'))
    if (!name.trim() || !list.length) return
    let schedule: Schedule = { type: 'daily' }
    if (repeat === 'weekly') {
      if (!days.length) return alert('En az bir gün seç.')
      schedule = { type: 'weekly', days }
    } else if (repeat === 'interval') {
      const n = parseInt(every)
      if (!(n >= 1 && n <= 60)) return alert('1 ile 60 arasında bir gün sayısı gir.')
      schedule = { type: 'interval', every: n, start }
    }
    const data = { name: name.trim(), dose: dose.trim(), times: list.sort(), schedule, remindBefore: remind }
    if (editing) {
      await db.meds.update(editing.id, data)
      const changed = editing.times.join() !== data.times.join() || JSON.stringify(scheduleOf(editing)) !== JSON.stringify(schedule)
        || (editing.remindBefore ?? DEFAULT_REMIND) !== remind
      if (changed) alert('Kaydedildi. Bu ilacı daha önce Takvim\'e eklediysen eski etkinliği Takvim\'den sil ve karttaki takvim simgesiyle yeniden ekle.')
    } else {
      await db.meds.add({ ...data, active: true } as never)
    }
    reset(); setEditing(null); setOpen(false)
  }

  async function toggle(medId: number, time: string) {
    const existing = logs.find(l => l.medId === medId && l.time === time)
    if (existing) await db.medLogs.delete(existing.id)
    else await db.medLogs.add({ medId, date: today, time, takenAt: Date.now() } as never)
  }

  const card = (m: Med) => (
    <MedCard
      key={m.id}
      m={m}
      today={today}
      taken={t => logs.some(l => l.medId === m.id && l.time === t)}
      onToggle={t => toggle(m.id, t)}
      onEdit={() => openEdit(m)}
    />
  )

  return (
    <div className="space-y-3">
      <PageHeader
        subtitle={total ? `Bugün ${takenCount} / ${total} alındı` : 'Günlük takip'}
        title="İlaç & Vitamin"
        action={<Fab label="İlaç ekle" onClick={openNew} />}
      />

      {meds.length === 0 && (
        <Card><Empty icon={Pill} title="Henüz ilaç yok" text="Sağ üstteki + ile ilaçları ve tekrar günlerini ekle." /></Card>
      )}

      {dueToday.length > 0 && <SectionTitle>Bugün</SectionTitle>}
      {dueToday.map(card)}

      {others.length > 0 && <SectionTitle>Bugün olmayanlar</SectionTitle>}
      {others.map(card)}

      {meds.length > 0 && (
        <>
          <SectionTitle>Hatırlatma</SectionTitle>
          <Button variant="soft" className="w-full" onClick={() => downloadFile('ilaclar.ics', medsToIcs(meds, today), 'text/calendar')}>
            <CalendarPlus size={18} /> Tüm ilaçları Takvim'e ekle
          </Button>
          <p className="px-1 text-[12px] text-faint">
            Takvime bir kez eklemek yeter, hatırlatmalar seçtiğin günlerde kendiliğinden tekrarlar. Yeni ilaç eklediğinde
            kartındaki takvim simgesiyle yalnızca onu ekle; tümünü yeniden eklemek eskileri çoğaltabilir.
          </p>
        </>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title={editing ? 'İlacı düzenle' : 'Yeni ilaç'}>
        <div className="space-y-4">
          <div><Label>Ad</Label><Input placeholder="Levotiron" value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Doz</Label><Input placeholder="150 mcg" value={dose} onChange={e => setDose(e.target.value)} /></div>
            <div><Label>Saat(ler)</Label><Input inputMode="numeric" placeholder="07:00" value={times} onChange={e => setTimes(e.target.value)} /></div>
          </div>

          <div>
            <Label>Tekrar</Label>
            <div className="grid grid-cols-3 gap-1 rounded-2xl bg-surface-2 border border-line p-1">
              {([['daily', 'Her gün'], ['weekly', 'Belirli günler'], ['interval', 'X günde bir']] as const).map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setRepeat(v)}
                  className={`h-10 rounded-xl text-[13px] font-semibold transition ${repeat === v ? 'bg-surface text-ink shadow' : 'text-muted'}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {repeat === 'weekly' && (
            <div>
              <div className="grid grid-cols-7 gap-1.5">
                {WEEK.map(w => {
                  const on = days.includes(w.d)
                  return (
                    <button
                      key={w.d}
                      onClick={() => setDays(on ? days.filter(x => x !== w.d) : [...days, w.d])}
                      className={`h-11 rounded-xl text-[13px] font-semibold border transition active:scale-95 ${
                        on ? 'bg-rose/15 border-rose/50 text-rose' : 'bg-surface-2 border-line text-muted'
                      }`}
                    >
                      {w.short}
                    </button>
                  )
                })}
              </div>
              <p className="px-1 pt-2 text-[12px] text-faint">
                Farklı günlerde farklı doz alıyorsa her doz için ayrı ilaç ekle (ör. Levotiron 150 → Pzt-Çar-Cum, Levotiron 200 → diğer günler).
              </p>
            </div>
          )}

          {repeat === 'interval' && (
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Kaç günde bir</Label><Input inputMode="numeric" value={every} onChange={e => setEvery(e.target.value)} /></div>
              <div><Label>Başlangıç</Label><Input type="date" value={start} onChange={e => setStart(e.target.value)} /></div>
            </div>
          )}

          <div>
            <Label>Hatırlatma</Label>
            <div className="flex flex-wrap gap-2">
              {REMIND_OPTIONS.map(r => <Chip key={r} active={remind === r} onClick={() => setRemind(r)}>{remindLabel(r)}</Chip>)}
            </div>
          </div>

          <Button className="w-full" onClick={save}>{editing ? 'Değişiklikleri kaydet' : 'Kaydet'}</Button>
          {editing && (
            <Button variant="ghost" className="w-full text-rose" onClick={remove}>
              <Trash2 size={18} /> İlacı sil
            </Button>
          )}
        </div>
      </Sheet>
    </div>
  )
}
