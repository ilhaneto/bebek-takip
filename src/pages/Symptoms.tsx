import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, ChevronRight, Plus, Settings2, Stethoscope, X } from 'lucide-react'
import { db, type SymptomDay } from '../db'
import { fmtDate, ymd } from '../lib/dates'
import { MOODS, SCORE_LABELS, lastDays, nextScores, saveDay, saveSymptomList, scoreColor, shiftDay, useSymptomList } from '../lib/symptoms'
import { Button, Card, Chip, Empty, IconButton, Input, PageHeader, SectionTitle, Sheet, Textarea } from '../components/ui'

const dayLabel = (d: string, today: string) =>
  d === today ? 'Bugün' : d === shiftDay(today, -1) ? 'Dün' : new Date(d + 'T00:00:00').toLocaleDateString('tr-TR', { weekday: 'long' })

function ScoreDots({ value, onPick }: { value?: number; onPick: (v: number) => void }) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map(v => (
        <button
          key={v}
          onClick={() => onPick(v)}
          aria-label={`${v} – ${SCORE_LABELS[v]}`}
          className="grid size-8 place-items-center rounded-full border text-[12px] font-bold transition active:scale-90"
          style={{
            background: value && v <= value ? scoreColor(value) : 'transparent',
            borderColor: value && v <= value ? 'rgb(255 122 156 / 0.6)' : 'var(--color-line)',
            color: value && v <= value ? '#fff' : 'var(--color-faint)',
          }}
        >
          {v}
        </button>
      ))}
    </div>
  )
}

function DayEditor({ date, setDate, list, onEditList }: { date: string; setDate: (d: string) => void; list: string[]; onEditList: () => void }) {
  const today = ymd()
  const day = useLiveQuery(() => db.symptoms.where('date').equals(date).first(), [date])
  const scores = day?.scores ?? {}
  const [note, setNote] = useState('')
  useEffect(() => setNote(day?.note ?? ''), [day?.id, day?.note])

  // Listeden çıkarılmış ama o gün puanı olan semptomlar da görünür
  const names = [...list, ...Object.keys(scores).filter(n => !list.includes(n))]
  const count = Object.keys(scores).length

  return (
    <div className="space-y-3">
      <Card className="flex items-center justify-between p-2">
        <IconButton icon={ChevronLeft} label="Önceki gün" onClick={() => setDate(shiftDay(date, -1))} />
        <div className="text-center">
          <p className="font-semibold capitalize">{dayLabel(date, today)}</p>
          <p className="text-[12px] text-muted">{fmtDate(date)}</p>
        </div>
        <IconButton icon={ChevronRight} label="Sonraki gün" disabled={date >= today} className="disabled:opacity-30" onClick={() => setDate(shiftDay(date, 1))} />
      </Card>

      <Card>
        <p className="mb-3 text-[13px] font-medium text-muted">Genel his</p>
        <div className="flex justify-between">
          {MOODS.map((m, i) => {
            const on = day?.mood === i + 1
            return (
              <button
                key={m}
                onClick={() => saveDay(date, { mood: on ? undefined : i + 1 })}
                className={`grid size-12 place-items-center rounded-2xl text-[26px] transition active:scale-90 ${on ? 'bg-violet/20 ring-2 ring-violet/60' : 'bg-surface-2 opacity-60'}`}
              >
                {m}
              </button>
            )
          })}
        </div>
      </Card>

      <SectionTitle right={<button onClick={onEditList} className="flex items-center gap-1 text-[13px] font-semibold text-muted"><Settings2 size={14} /> Düzenle</button>}>
        Semptomlar {count > 0 && `· ${count}`}
      </SectionTitle>
      <Card className="p-1.5">
        {names.map((n, i) => (
          <div key={n} className={`flex items-center justify-between gap-2 px-2.5 py-2.5 ${i ? 'border-t border-line/70' : ''}`}>
            <div className="min-w-0">
              <p className={`truncate text-[15px] ${scores[n] ? 'font-semibold' : 'text-muted'}`}>{n}</p>
              {scores[n] && <p className="text-[11px] text-rose">{SCORE_LABELS[scores[n]]}</p>}
            </div>
            <ScoreDots value={scores[n]} onPick={v => saveDay(date, { scores: nextScores(scores, n, v) })} />
          </div>
        ))}
      </Card>
      <p className="px-1 text-[12px] text-faint">1 = hafif, 5 = çok şiddetli. Aynı puana tekrar dokunursan kaldırılır.</p>

      <Textarea
        rows={2}
        placeholder="Bugüne dair not (isteğe bağlı)"
        value={note}
        onChange={e => setNote(e.target.value)}
        onBlur={() => note !== (day?.note ?? '') && saveDay(date, { note: note.trim() || undefined })}
      />
    </div>
  )
}

function History({ list, onPickDay }: { list: string[]; onPickDay: (d: string) => void }) {
  const [range, setRange] = useState(14)
  const today = ymd()
  const days = lastDays(today, range)
  const rows = useLiveQuery(() => db.symptoms.where('date').between(days[0], today, true, true).toArray(), [days[0], today])
  const scroller = useRef<HTMLDivElement>(null)
  // En yeni günler sağda; açılışta oraya kaydır
  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [range, rows === undefined])
  if (rows === undefined) return null

  const byDate = new Map<string, SymptomDay>(rows.map(r => [r.date, r]))
  const used = new Set(rows.flatMap(r => Object.keys(r.scores)))
  // Önce listedeki sırayla, sonra listeden çıkarılmış ama puanı olanlar
  const names = [...list.filter(n => used.has(n)), ...[...used].filter(n => !list.includes(n))]
  const hasMood = rows.some(r => r.mood)
  const daysWith = (n: string) => rows.filter(r => r.scores[n]).length

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {[7, 14, 30].map(r => <Chip key={r} active={range === r} onClick={() => setRange(r)}>{r} gün</Chip>)}
      </div>

      {names.length === 0 && !hasMood ? (
        <Card><Empty icon={Stethoscope} title="Bu aralıkta kayıt yok" text="Günlük sekmesinden semptom puanı girince burada görünür." /></Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div ref={scroller} className="overflow-x-auto [scrollbar-width:none]">
            <table className="border-separate border-spacing-0 text-[12px]">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-surface px-3 py-2 text-left font-medium text-faint">Semptom</th>
                  {days.map(d => (
                    <th key={d} className="px-0.5 py-2 font-medium">
                      <button onClick={() => onPickDay(d)} className={`flex w-7 flex-col items-center rounded-lg py-0.5 ${d === today ? 'bg-rose/15 text-rose' : 'text-faint'}`}>
                        <span className="text-[10px] uppercase">{new Date(d + 'T00:00:00').toLocaleDateString('tr-TR', { weekday: 'narrow' })}</span>
                        <span className="text-[12px] font-semibold">{+d.slice(8)}</span>
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hasMood && (
                  <tr>
                    <td className="sticky left-0 z-10 border-t border-line/70 bg-surface px-3 py-1.5 font-medium">Genel his</td>
                    {days.map(d => {
                      const m = byDate.get(d)?.mood
                      return (
                        <td key={d} className="border-t border-line/70 px-0.5 py-1 text-center">
                          <button onClick={() => onPickDay(d)} className="w-7 text-[16px] leading-7">{m ? MOODS[m - 1] : <span className="text-line">·</span>}</button>
                        </td>
                      )
                    })}
                  </tr>
                )}
                {names.map(n => (
                  <tr key={n}>
                    <td className="sticky left-0 z-10 max-w-[120px] border-t border-line/70 bg-surface px-3 py-1.5">
                      <p className="truncate font-medium">{n}</p>
                      <p className="text-[10px] text-faint">{daysWith(n)} gün</p>
                    </td>
                    {days.map(d => {
                      const v = byDate.get(d)?.scores[n]
                      return (
                        <td key={d} className="border-t border-line/70 px-0.5 py-1">
                          <button
                            onClick={() => onPickDay(d)}
                            className="grid size-7 place-items-center rounded-md text-[11px] font-bold text-white"
                            style={{ background: v ? scoreColor(v) : 'rgb(42 38 53 / 0.5)' }}
                          >
                            {v ?? ''}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="flex items-center gap-1.5 px-1 text-[11px] text-faint">
        <span>Hafif</span>
        {[1, 2, 3, 4, 5].map(v => <span key={v} className="size-4 rounded" style={{ background: scoreColor(v) }} />)}
        <span>Çok şiddetli</span>
        <span className="ml-auto">Güne dokun → düzenle</span>
      </div>
    </div>
  )
}

export default function Symptoms() {
  const [params, setParams] = useSearchParams()
  const view = params.get('gorunum') === 'cizelge' ? 'cizelge' : 'gunluk'
  const date = params.get('gun') ?? ymd()
  const list = useSymptomList()
  const [editing, setEditing] = useState(false)
  const [newName, setNewName] = useState('')

  const go = (v: 'gunluk' | 'cizelge', d?: string) =>
    setParams(p => {
      p.set('gorunum', v)
      if (d) p.set('gun', d)
      return p
    }, { replace: true })

  if (!list) return null

  return (
    <div className="space-y-3">
      <PageHeader compact subtitle="1–5 arası şiddet" title="Semptomlar" />
      <div className="flex gap-2">
        <Chip active={view === 'gunluk'} onClick={() => go('gunluk')}>Günlük</Chip>
        <Chip active={view === 'cizelge'} onClick={() => go('cizelge')}>Çizelge</Chip>
      </div>

      {view === 'gunluk'
        ? <DayEditor date={date} setDate={d => go('gunluk', d)} list={list} onEditList={() => setEditing(true)} />
        : <History list={list} onPickDay={d => go('gunluk', d)} />}

      <Sheet open={editing} onClose={() => setEditing(false)} title="Takip edilen semptomlar">
        <div className="space-y-3">
          <Card className="p-1.5">
            {list.map((n, i) => (
              <div key={n} className={`flex items-center justify-between px-3 py-2 ${i ? 'border-t border-line/70' : ''}`}>
                <span>{n}</span>
                <IconButton icon={X} label={`${n} çıkar`} className="-my-1" onClick={() => saveSymptomList(list.filter(x => x !== n))} />
              </div>
            ))}
          </Card>
          <div className="flex gap-2">
            <Input placeholder="Yeni semptom (ör. Burun tıkanıklığı)" value={newName} onChange={e => setNewName(e.target.value)} />
            <Button
              aria-label="Ekle"
              onClick={() => {
                const n = newName.trim()
                if (n && !list.includes(n)) saveSymptomList([...list, n])
                setNewName('')
              }}
            >
              <Plus size={20} />
            </Button>
          </div>
          <p className="px-1 text-[12px] text-faint">Listeden çıkarılan semptomun geçmiş puanları silinmez, çizelgede görünmeye devam eder.</p>
        </div>
      </Sheet>
    </div>
  )
}
