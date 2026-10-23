import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Droplet, HeartPulse, Scale, Trash2, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react'
import { db, type Measurement, type MeasureType } from '../db'
import { fmtDate, ymd } from '../lib/dates'
import { MEASURES, SUGAR_TAGS, byTime, formatValue, parseNum, validate } from '../lib/measures'
import { Button, Card, Chip, Empty, Fab, IconButton, Input, Label, PageHeader, SectionTitle, Sheet, Textarea, useOpenFromQuickAdd } from '../components/ui'

const TYPES: { type: MeasureType; icon: LucideIcon; tone: string }[] = [
  { type: 'kilo', icon: Scale, tone: 'text-mint' },
  { type: 'tansiyon', icon: HeartPulse, tone: 'text-rose' },
  { type: 'seker', icon: Droplet, tone: 'text-amber' },
]

const SERIES = ['url(#ml)', '#5eead4']

function Chart({ pts }: { pts: Measurement[] }) {
  if (pts.length < 2) return <p className="py-6 text-center text-sm text-muted">Grafik için en az 2 kayıt gerekir.</p>
  const W = 340, H = 150, P = 8
  const series = pts[0].type === 'tansiyon' ? [pts.map(p => p.value), pts.map(p => p.value2 ?? p.value)] : [pts.map(p => p.value)]
  const all = series.flat()
  const pad = pts[0].type === 'kilo' ? 0.5 : 5
  const lo = Math.min(...all) - pad, hi = Math.max(...all) + pad
  const x = (i: number) => P + (i * (W - 2 * P)) / (pts.length - 1)
  const y = (v: number) => P + (1 - (v - lo) / (hi - lo)) * (H - 2 * P)
  const path = (vals: number[]) => vals.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ')
  const first = series[0]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible">
      <defs>
        <linearGradient id="ml" x1="0" x2="1"><stop offset="0" stopColor="#ff7a9c" /><stop offset="1" stopColor="#a78bfa" /></linearGradient>
        <linearGradient id="ma" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#a78bfa" stopOpacity="0.35" /><stop offset="1" stopColor="#a78bfa" stopOpacity="0" /></linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map(f => <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="#2a2635" strokeDasharray="3 5" />)}
      {series.length === 1 && <path d={`${path(first)} L${x(pts.length - 1)},${H} L${x(0)},${H} Z`} fill="url(#ma)" />}
      {series.map((vals, s) => (
        <g key={s}>
          <path d={path(vals)} fill="none" stroke={SERIES[s]} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={x(vals.length - 1)} cy={y(vals[vals.length - 1])} r="5" fill="#0b0a10" stroke={s ? SERIES[1] : '#a78bfa'} strokeWidth="3" />
        </g>
      ))}
    </svg>
  )
}

const nowTime = () => new Date().toTimeString().slice(0, 5)

export default function Measures() {
  const [params, setParams] = useSearchParams()
  const type = (TYPES.find(t => t.type === params.get('tur'))?.type ?? 'kilo') as MeasureType
  const setType = (t: MeasureType) => setParams(p => { p.set('tur', t); return p }, { replace: true })

  const loaded = useLiveQuery(() => db.measurements.where('type').equals(type).toArray(), [type])
  const rows = (loaded ?? []).sort(byTime)

  const [open, setOpen] = useState(false)
  const [formType, setFormType] = useState<MeasureType>(type)
  const [v1, setV1] = useState('')
  const [v2, setV2] = useState('')
  const [date, setDate] = useState(ymd())
  const [time, setTime] = useState(nowTime())
  const [tag, setTag] = useState(SUGAR_TAGS[0])
  const [note, setNote] = useState('')

  function openNew(t: MeasureType = type) {
    setFormType(t); setV1(''); setV2(''); setDate(ymd()); setTime(nowTime()); setTag(SUGAR_TAGS[0]); setNote(''); setOpen(true)
  }
  useOpenFromQuickAdd(() => openNew())

  async function save() {
    const a = parseNum(v1), b = formType === 'tansiyon' ? parseNum(v2) : null
    const err = validate(formType, a, b)
    if (err) return alert(err)
    await db.measurements.add({
      type: formType, date, value: a!,
      ...(formType !== 'kilo' && { time }),
      ...(formType === 'tansiyon' && { value2: b! }),
      ...(formType === 'seker' && { tag }),
      ...(note.trim() && { note: note.trim() }),
    } as never)
    setOpen(false)
    if (formType !== type) setType(formType)
  }

  const meta = MEASURES[type]
  const last = rows[rows.length - 1]
  const change = type === 'kilo' && rows.length > 1 ? last.value - rows[0].value : null
  const Trend = change !== null && change < 0 ? TrendingDown : TrendingUp
  const current = TYPES.find(t => t.type === type)!

  return (
    <div className="space-y-3">
      <PageHeader compact subtitle="Gebelik boyunca" title="Ölçümler" action={<Fab label="Ölçüm ekle" onClick={() => openNew()} />} />

      <div className="flex gap-2">
        {TYPES.map(t => (
          <Chip key={t.type} active={t.type === type} onClick={() => setType(t.type)}>{MEASURES[t.type].label}</Chip>
        ))}
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-[13px] text-muted">Son ölçüm{last?.tag ? ` · ${last.tag}` : ''}</p>
            <p className="mt-1 text-[34px] font-bold leading-none">
              {last ? formatValue(last) : '—'}<span className="ml-1 text-[16px] font-medium text-muted">{meta.unit}</span>
            </p>
            {last && <p className="mt-1 text-[12px] text-faint">{fmtDate(last.date)}{last.time && ` · ${last.time}`}</p>}
          </div>
          {change !== null && (
            <span className="flex items-center gap-1 rounded-full bg-violet/15 px-3 py-1.5 text-[13px] font-semibold text-violet">
              <Trend size={15} /> {change > 0 ? '+' : ''}{change.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} kg
            </span>
          )}
        </div>
        {loaded === undefined ? <div className="h-[150px]" />
          : rows.length ? <Chart pts={rows} />
          : <Empty icon={current.icon} title="Henüz ölçüm yok" text="Sağ üstteki + ile ilk ölçümü ekle." />}
        {type === 'tansiyon' && rows.length > 1 && (
          <div className="mt-2 flex gap-4 text-[12px] text-muted">
            <span className="flex items-center gap-1.5"><span className="h-1 w-4 rounded bg-gradient-to-r from-rose to-violet" /> Büyük</span>
            <span className="flex items-center gap-1.5"><span className="h-1 w-4 rounded bg-mint" /> Küçük</span>
          </div>
        )}
      </Card>

      {rows.length > 0 && <SectionTitle>Geçmiş</SectionTitle>}
      {rows.length > 0 && (
        <Card className="p-1.5">
          {[...rows].reverse().map((r, i) => (
            <div key={r.id} className={`flex items-center gap-3 px-3 py-2.5 ${i ? 'border-t border-line' : ''}`}>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] text-muted">{fmtDate(r.date)}{r.time && <span className="text-faint"> · {r.time}</span>}</p>
                {(r.tag || r.note) && <p className="truncate text-[12px] text-faint">{[r.tag, r.note].filter(Boolean).join(' · ')}</p>}
              </div>
              <b className="text-[15px]">{formatValue(r)} <span className="text-[12px] font-medium text-muted">{meta.unit}</span></b>
              <IconButton icon={Trash2} label="Sil" className="-my-2" onClick={() => confirm('Ölçüm silinsin mi?') && db.measurements.delete(r.id)} />
            </div>
          ))}
        </Card>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="Yeni ölçüm">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-1 rounded-2xl border border-line bg-surface-2 p-1">
            {TYPES.map(t => (
              <button
                key={t.type}
                onClick={() => setFormType(t.type)}
                className={`flex h-10 items-center justify-center gap-1.5 rounded-xl text-[13px] font-semibold transition ${formType === t.type ? 'bg-surface text-ink shadow' : 'text-muted'}`}
              >
                <t.icon size={15} className={formType === t.type ? t.tone : ''} /> {MEASURES[t.type].label}
              </button>
            ))}
          </div>

          {formType === 'tansiyon' ? (
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Büyük (mmHg)</Label><Input inputMode="numeric" placeholder="120" value={v1} onChange={e => setV1(e.target.value)} /></div>
              <div><Label>Küçük (mmHg)</Label><Input inputMode="numeric" placeholder="80" value={v2} onChange={e => setV2(e.target.value)} /></div>
            </div>
          ) : (
            <div>
              <Label>{MEASURES[formType].label} ({MEASURES[formType].unit})</Label>
              <Input inputMode="decimal" placeholder={MEASURES[formType].placeholder} value={v1} onChange={e => setV1(e.target.value)} />
            </div>
          )}

          {formType === 'seker' && (
            <div className="flex flex-wrap gap-2">
              {SUGAR_TAGS.map(t => <Chip key={t} active={tag === t} onClick={() => setTag(t)}>{t}</Chip>)}
            </div>
          )}

          <div className={`grid gap-2 ${formType === 'kilo' ? '' : 'grid-cols-2'}`}>
            <div><Label>Tarih</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
            {formType !== 'kilo' && <div><Label>Saat</Label><Input type="time" value={time} onChange={e => setTime(e.target.value)} /></div>}
          </div>

          <div><Label>Not (isteğe bağlı)</Label><Textarea rows={2} placeholder="Ör. sabah aç karnına" value={note} onChange={e => setNote(e.target.value)} /></div>

          <Button className="w-full" onClick={save}>Kaydet</Button>
        </div>
      </Sheet>
    </div>
  )
}
