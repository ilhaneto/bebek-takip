import { useEffect, useState } from 'react'
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

const CH = { W: 320, H: 84, L: 14, R: 6, T: 6, B: 6 }

/** Tek semptomun günlere göre şiddet grafiği. null = o gün kayıt yok (çizgi kesilir), 0 = kayıt var ama semptom yok. */
function SeverityChart({ values, sel, onSel, mood }: { values: (number | null)[]; sel: number | null; onSel: (i: number | null) => void; mood?: boolean }) {
  const { W, H, L, R, T, B } = CH
  const n = values.length
  const x = (i: number) => L + (n === 1 ? 0 : (i * (W - L - R)) / (n - 1))
  const y = (v: number) => T + (1 - v / 5) * (H - T - B)
  const base = mood ? 1 : 0
  // Kayıt olmayan günlerde çizgiyi böl
  const segs: { i: number; v: number }[][] = []
  values.forEach((v, i) => {
    if (v === null) return
    const last = segs[segs.length - 1]
    if (last && last[last.length - 1].i === i - 1) last.push({ i, v })
    else segs.push([{ i, v }])
  })
  const color = mood ? '#a78bfa' : '#ff7a9c'
  const step = (W - L - R) / Math.max(1, n - 1)
  return (
    // Seçim kalıcı: dokunmatikte parmak kalkınca pointerleave tetiklendiği için orada temizlenmez
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none">
      {[1, 3, 5].map(g => (
        <g key={g}>
          <line x1={L} x2={W - R} y1={y(g)} y2={y(g)} stroke="#2a2635" strokeDasharray={g === 5 ? '' : '2 4'} />
          <text x={0} y={y(g) + 3} fontSize="9" fill="#6b6578">{g}</text>
        </g>
      ))}
      {segs.map((s, k) => (
        <g key={k}>
          {s.length > 1 && (
            <path
              d={`${s.map((p, j) => `${j ? 'L' : 'M'}${x(p.i)},${y(p.v)}`).join(' ')} L${x(s[s.length - 1].i)},${y(base)} L${x(s[0].i)},${y(base)} Z`}
              fill={color} fillOpacity="0.12"
            />
          )}
          <path d={s.map((p, j) => `${j ? 'L' : 'M'}${x(p.i)},${y(p.v)}`).join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        </g>
      ))}
      {sel !== null && <line x1={x(sel)} x2={x(sel)} y1={T} y2={H - B} stroke="#9a93a8" strokeWidth="1" />}
      {values.map((v, i) => v !== null && (v > 0 || i === sel) && (
        <circle key={i} cx={x(i)} cy={y(v)} r={i === sel ? 4.5 : n > 14 ? 2.5 : 3.5} fill={color} stroke="#15131c" strokeWidth="2" />
      ))}
      {/* Dokunma alanları: noktadan geniş */}
      {values.map((_, i) => (
        <rect key={i} x={x(i) - step / 2} y={0} width={step} height={H} fill="transparent" onClick={() => onSel(sel === i ? null : i)} onPointerEnter={e => e.pointerType === 'mouse' && onSel(i)} />
      ))}
    </svg>
  )
}

function History({ list, onPickDay }: { list: string[]; onPickDay: (d: string) => void }) {
  const [range, setRange] = useState(14)
  const [sel, setSel] = useState<number | null>(null)
  const today = ymd()
  const days = lastDays(today, range)
  const rows = useLiveQuery(() => db.symptoms.where('date').between(days[0], today, true, true).toArray(), [days[0], today])
  if (rows === undefined) return null

  const byDate = new Map<string, SymptomDay>(rows.map(r => [r.date, r]))
  const used = new Set(rows.flatMap(r => Object.keys(r.scores)))
  // Önce listedeki sırayla, sonra listeden çıkarılmış ama puanı olanlar
  const names = [...list.filter(n => used.has(n)), ...[...used].filter(n => !list.includes(n))]
  const hasMood = rows.some(r => r.mood)
  const series = (n: string) => days.map(d => (byDate.has(d) ? byDate.get(d)!.scores[n] ?? 0 : null))
  const moodSeries = days.map(d => byDate.get(d)?.mood ?? null)
  const selDay = sel !== null ? days[sel] : null

  const stats = (vals: (number | null)[]) => {
    const on = vals.filter((v): v is number => !!v)
    return { days: on.length, avg: on.length ? on.reduce((a, b) => a + b, 0) / on.length : 0, max: on.length ? Math.max(...on) : 0 }
  }
  const fmt = (v: number) => v.toLocaleString('tr-TR', { maximumFractionDigits: 1 })
  const axis = (
    <div className="flex justify-between pl-[14px] pr-[6px] text-[10px] text-faint">
      <span>{fmtDate(days[0])}</span>
      <span>{fmtDate(days[Math.floor(days.length / 2)])}</span>
      <span>Bugün</span>
    </div>
  )

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {[7, 14, 30].map(r => <Chip key={r} active={range === r} onClick={() => { setRange(r); setSel(null) }}>{r} gün</Chip>)}
      </div>

      {/* Seçili gün bilgisi; grafiklerdeki dikey çizgiyle eşleşir */}
      <Card className="flex min-h-14 items-center justify-between py-2.5">
        {selDay ? (
          <>
            <div>
              <p className="font-semibold capitalize">{dayLabel(selDay, today)} · {fmtDate(selDay)}</p>
              <p className="text-[12px] text-muted">
                {byDate.has(selDay)
                  ? Object.entries(byDate.get(selDay)!.scores).map(([k, v]) => `${k} ${v}`).join(' · ') || 'Semptom yok'
                  : 'Kayıt yok'}
              </p>
            </div>
            <Button variant="soft" className="min-h-9 px-3 text-[13px]" onClick={() => onPickDay(selDay)}>Düzenle</Button>
          </>
        ) : (
          <p className="text-[13px] text-muted">Grafikte bir güne dokun, o günün puanları burada görünür.</p>
        )}
      </Card>

      {names.length === 0 && !hasMood && (
        <Card><Empty icon={Stethoscope} title="Bu aralıkta kayıt yok" text="Günlük sekmesinden semptom puanı girince burada görünür." /></Card>
      )}

      {hasMood && (
        <Card>
          <div className="mb-1 flex items-baseline justify-between">
            <p className="font-semibold">Genel his</p>
            <p className="text-[12px] text-muted">{sel !== null && moodSeries[sel] ? MOODS[moodSeries[sel]! - 1] : `ort. ${fmt(stats(moodSeries).avg)}`}</p>
          </div>
          <SeverityChart values={moodSeries} sel={sel} onSel={setSel} mood />
          {axis}
        </Card>
      )}

      {names.map(n => {
        const vals = series(n)
        const s = stats(vals)
        return (
          <Card key={n}>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <p className="truncate font-semibold">{n}</p>
              <p className="shrink-0 text-[12px] text-muted">
                {sel !== null
                  ? vals[sel] === null ? 'kayıt yok' : vals[sel] ? `${vals[sel]} · ${SCORE_LABELS[vals[sel]!]}` : 'yok'
                  : `${s.days} gün · ort. ${fmt(s.avg)} · en çok ${s.max}`}
              </p>
            </div>
            <SeverityChart values={vals} sel={sel} onSel={setSel} />
            {axis}
          </Card>
        )
      })}
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
