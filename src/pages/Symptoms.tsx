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

/** Koyu zemin için doğrulanmış kategorik renkler; sıra sabit, semptomun listedeki yerine göre atanır. */
const SERIES_COLORS = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767']
const OVERFLOW_COLOR = '#6b6578'
const MOOD_COLOR = '#9a93a8'

interface Series { name: string; color: string; values: (number | null)[]; dashed?: boolean }

/** Tüm semptomlar tek grafikte. null = o gün kayıt yok (çizgi kesilir), 0 = kayıt var ama semptom yok. */
function CombinedChart({ series, n, sel, onSel }: { series: Series[]; n: number; sel: number | null; onSel: (i: number | null) => void }) {
  const W = 320, H = 170, L = 14, R = 8, T = 8, B = 8
  const x = (i: number) => L + (n === 1 ? 0 : (i * (W - L - R)) / (n - 1))
  const y = (v: number) => T + (1 - v / 5) * (H - T - B)
  const step = (W - L - R) / Math.max(1, n - 1)
  const segments = (values: (number | null)[]) => {
    const segs: { i: number; v: number }[][] = []
    values.forEach((v, i) => {
      if (v === null) return
      const last = segs[segs.length - 1]
      if (last && last[last.length - 1].i === i - 1) last.push({ i, v })
      else segs.push([{ i, v }])
    })
    return segs
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none">
      {[0, 1, 2, 3, 4, 5].map(g => (
        <g key={g}>
          <line x1={L} x2={W - R} y1={y(g)} y2={y(g)} stroke="#2a2635" strokeDasharray={g === 0 ? '' : '2 4'} />
          {g > 0 && <text x={0} y={y(g) + 3} fontSize="9" fill="#6b6578">{g}</text>}
        </g>
      ))}
      {sel !== null && <line x1={x(sel)} x2={x(sel)} y1={T} y2={H - B} stroke="#9a93a8" strokeWidth="1" />}
      {series.map(s => (
        <g key={s.name}>
          {segments(s.values).map((seg, k) => (
            <path
              key={k}
              d={seg.map((p, j) => `${j ? 'L' : 'M'}${x(p.i)},${y(p.v)}`).join(' ')}
              fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
              strokeDasharray={s.dashed ? '4 4' : undefined}
            />
          ))}
          {s.values.map((v, i) => v !== null && (v > 0 || i === sel) && (
            <circle key={i} cx={x(i)} cy={y(v)} r={i === sel ? 4.5 : n > 14 ? 2.5 : 3.5} fill={s.color} stroke="#15131c" strokeWidth="2" />
          ))}
        </g>
      ))}
      {/* Dokunma alanları noktadan geniş; seçim kalıcı (dokunmatikte pointerleave parmak kalkınca tetiklenir) */}
      {Array.from({ length: n }, (_, i) => (
        <rect key={i} x={x(i) - step / 2} y={0} width={step} height={H} fill="transparent"
          onClick={() => onSel(sel === i ? null : i)} onPointerEnter={e => e.pointerType === 'mouse' && onSel(i)} />
      ))}
    </svg>
  )
}

function History({ list, onPickDay }: { list: string[]; onPickDay: (d: string) => void }) {
  const [range, setRange] = useState(14)
  const [sel, setSel] = useState<number | null>(null)
  // Varsayılandan çevrilenler: genel his ve 8 rengi aşan semptomlar varsayılan kapalı, diğerleri açık
  const [flipped, setFlipped] = useState<Set<string>>(() => new Set())
  const today = ymd()
  const days = lastDays(today, range)
  const rows = useLiveQuery(() => db.symptoms.where('date').between(days[0], today, true, true).toArray(), [days[0], today])
  if (rows === undefined) return null

  const byDate = new Map<string, SymptomDay>(rows.map(r => [r.date, r]))
  const used = new Set(rows.flatMap(r => Object.keys(r.scores)))
  // Renk listedeki sıraya göre sabit; gizleme ya da aralık değişince renkler kaymaz
  const order = [...list, ...[...used].filter(n => !list.includes(n)).sort()]
  const colorOf = (name: string) => SERIES_COLORS[order.indexOf(name)] ?? OVERFLOW_COLOR
  const names = order.filter(n => used.has(n))
  const hasMood = rows.some(r => r.mood)

  const all: Series[] = [
    ...names.map(n => ({ name: n, color: colorOf(n), values: days.map(d => (byDate.has(d) ? byDate.get(d)!.scores[n] ?? 0 : null)) })),
    ...(hasMood ? [{ name: 'Genel his', color: MOOD_COLOR, dashed: true, values: days.map(d => byDate.get(d)?.mood ?? null) }] : []),
  ]
  const offByDefault = (s: Series) => !!s.dashed || s.color === OVERFLOW_COLOR
  const hidden = new Set(all.filter(s => offByDefault(s) !== flipped.has(s.name)).map(s => s.name))
  // Gri (renk dışı) seriler en alta çizilir, renkli çizgileri örtmez
  const visible = all.filter(s => !hidden.has(s.name)).sort((a, b) => +(b.color === OVERFLOW_COLOR) - +(a.color === OVERFLOW_COLOR))
  const toggle = (name: string) => setFlipped(h => {
    const next = new Set(h)
    if (next.has(name)) next.delete(name)
    else next.add(name)
    return next
  })
  const selDay = sel !== null ? days[sel] : null
  const daysWith = (s: Series) => s.values.filter(v => !!v).length

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {[7, 14, 30].map(r => <Chip key={r} active={range === r} onClick={() => { setRange(r); setSel(null) }}>{r} gün</Chip>)}
      </div>

      {all.length === 0 ? (
        <Card><Empty icon={Stethoscope} title="Bu aralıkta kayıt yok" text="Günlük sekmesinden semptom puanı girince burada görünür." /></Card>
      ) : (
        <Card>
          <div className="mb-2 flex min-h-10 items-center justify-between gap-2">
            {selDay ? (
              <>
                <div className="min-w-0">
                  <p className="font-semibold capitalize">{dayLabel(selDay, today)} · {fmtDate(selDay)}</p>
                  {!byDate.has(selDay) && <p className="text-[12px] text-muted">Kayıt yok</p>}
                </div>
                <Button variant="soft" className="min-h-9 shrink-0 px-3 text-[13px]" onClick={() => onPickDay(selDay)}>Düzenle</Button>
              </>
            ) : (
              <p className="text-[13px] text-muted">Bir güne dokun, değerleri gör.</p>
            )}
          </div>

          <CombinedChart series={visible} n={days.length} sel={sel} onSel={setSel} />
          <div className="flex justify-between pl-[14px] pr-[8px] text-[10px] text-faint">
            <span>{fmtDate(days[0])}</span>
            <span>{fmtDate(days[Math.floor(days.length / 2)])}</span>
            <span>Bugün</span>
          </div>

          {/* Gösterge = aç/kapat düğmeleri; seçili gün varsa o günün değeri, yoksa kaç gün görüldüğü */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {all.map(s => {
              const off = hidden.has(s.name)
              const v = sel !== null ? s.values[sel] : null
              const info = sel !== null
                ? v === null ? '–' : s.name === 'Genel his' ? (v ? MOODS[v - 1] : '–') : v ? String(v) : '0'
                : `${daysWith(s)}g`
              return (
                <button
                  key={s.name}
                  onClick={() => toggle(s.name)}
                  aria-pressed={!off}
                  className={`flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-[12px] font-medium transition active:scale-95 ${off ? 'border-line text-faint' : 'border-line bg-surface-2 text-ink'}`}
                >
                  <span
                    className="h-0.5 w-3.5 rounded-full"
                    style={{ background: off ? 'transparent' : s.color, border: off ? `1px solid ${s.color}` : undefined, borderStyle: s.dashed ? 'dashed' : undefined }}
                  />
                  <span className={off ? 'line-through' : ''}>{s.name}</span>
                  {!off && <span className="text-muted tabular-nums">{info}</span>}
                </button>
              )
            })}
          </div>
        </Card>
      )}
      <p className="px-1 text-[12px] text-faint">Dokunarak semptomları grafikte aç/kapat. 1 = hafif, 5 = çok şiddetli. Genel his: 1 = çok kötü, 5 = çok iyi.</p>
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
