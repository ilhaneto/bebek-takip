import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { CalendarHeart, ChevronRight, Download, Pill, Upload } from 'lucide-react'
import { db } from '../db'
import { fmtDateTime, pregnancyWeek, ymd } from '../lib/dates'
import { exportBackup, importBackup } from '../lib/backup'
import { Card, IconBadge, Input, Label, SectionTitle } from '../components/ui'

function Ring({ value, children }: { value: number; children: React.ReactNode }) {
  const r = 52, c = 2 * Math.PI * r
  return (
    <div className="relative size-[132px] shrink-0">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <defs>
          <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ff7a9c" />
            <stop offset="1" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={r} fill="none" stroke="#2a2635" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={r} fill="none" stroke="url(#ring)" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, Math.max(0, value)))}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  )
}

const greeting = () => {
  const h = new Date().getHours()
  return h < 6 ? 'İyi geceler' : h < 12 ? 'Günaydın' : h < 18 ? 'İyi günler' : 'İyi akşamlar'
}

export default function Home() {
  const nav = useNavigate()
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
  const dateLabel = new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="space-y-3">
      <header className="pt-2 pb-3">
        <p className="text-[13px] font-medium text-muted capitalize">{dateLabel}</p>
        <h1 className="text-[30px] font-bold tracking-tight">{greeting()} ✨</h1>
      </header>

      <Card className="relative overflow-hidden p-5">
        <div className="absolute -right-16 -top-16 size-48 rounded-full bg-violet/20 blur-3xl" />
        {preg ? (
          <div className="relative flex items-center gap-5">
            <Ring value={(280 - preg.daysLeft) / 280}>
              <div>
                <div className="text-[34px] font-bold leading-none">{preg.week}</div>
                <div className="text-[12px] text-muted mt-1">hafta {preg.day > 0 && `+${preg.day}g`}</div>
              </div>
            </Ring>
            <div className="min-w-0">
              <p className="text-[13px] text-muted">Doğuma</p>
              <p className="text-[28px] font-bold leading-tight">
                {preg.daysLeft > 0 ? `${preg.daysLeft} gün` : 'Zamanı geldi 💕'}
              </p>
              <p className="text-[13px] text-muted mt-1">{Math.min(3, Math.floor(preg.week / 13) + 1)}. trimester</p>
            </div>
          </div>
        ) : (
          <div className="relative">
            <p className="font-semibold text-lg">Hoş geldin 💕</p>
            <p className="text-sm text-muted mb-4">Haftayı takip etmek için tahmini doğum tarihini gir.</p>
          </div>
        )}
        <div className="relative mt-4">
          <Label>Tahmini doğum tarihi</Label>
          <Input type="date" value={due ?? ''} onChange={e => db.settings.put({ key: 'dueDate', value: e.target.value })} />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card onClick={() => nav('/ilac')}>
          <IconBadge icon={Pill} tone="rose" />
          <p className="text-[13px] text-muted mt-3">Bugünün ilaçları</p>
          <p className="text-[22px] font-bold">{total === 0 ? '—' : `${logs.length}/${total}`}</p>
          {total > 0 && (
            <div className="mt-2 h-1.5 rounded-full bg-line overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-rose to-violet transition-all" style={{ width: `${(logs.length / total) * 100}%` }} />
            </div>
          )}
        </Card>
        <Card onClick={() => nav('/randevu')}>
          <IconBadge icon={CalendarHeart} tone="violet" />
          <p className="text-[13px] text-muted mt-3">Sıradaki randevu</p>
          {next ? (
            <>
              <p className="text-[15px] font-bold leading-snug line-clamp-2">{next.title}</p>
              <p className="text-[12px] text-muted mt-0.5">{fmtDateTime(next.at)}</p>
            </>
          ) : (
            <p className="text-[22px] font-bold">—</p>
          )}
        </Card>
      </div>

      <SectionTitle>Veriler</SectionTitle>
      <Card className="p-2">
        <button onClick={exportBackup} className="flex w-full items-center gap-3 rounded-2xl p-2.5 active:bg-surface-2">
          <IconBadge icon={Download} tone="mint" />
          <div className="flex-1 text-left">
            <p className="font-semibold">Yedek al</p>
            <p className="text-[13px] text-muted">Veriler yalnızca bu telefonda durur</p>
          </div>
          <ChevronRight size={18} className="text-faint" />
        </button>
        <div className="mx-3 h-px bg-line" />
        <button onClick={() => fileRef.current?.click()} className="flex w-full items-center gap-3 rounded-2xl p-2.5 active:bg-surface-2">
          <IconBadge icon={Upload} tone="amber" />
          <div className="flex-1 text-left">
            <p className="font-semibold">Yedekten geri yükle</p>
            <p className="text-[13px] text-muted">Mevcut verilerin yerine geçer</p>
          </div>
          <ChevronRight size={18} className="text-faint" />
        </button>
      </Card>
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
  )
}
