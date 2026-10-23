import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Activity, CalendarHeart, Check, ChevronRight, MapPin, Pill, Settings } from 'lucide-react'
import { MOODS } from '../lib/symptoms'
import { db } from '../db'
import { fmtDateTime, pregnancyWeek } from '../lib/dates'
import { useTodayMeds } from '../lib/useTodayMeds'
import { Card, Empty, IconBadge, SectionTitle } from '../components/ui'

function Ring({ value, children }: { value: number; children: ReactNode }) {
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
  // undefined = yükleniyor, null = girilmemiş (yüklenirken "Hoş geldin" kartı yanıp sönmesin)
  const dueRow = useLiveQuery(() => db.settings.get('dueDate').then(r => r ?? null), [])
  const due = dueRow?.value
  const next = useLiveQuery(
    () => db.appointments.where('at').above(new Date().toISOString().slice(0, 16)).first(),
    [],
  )
  const { loaded, today, dueToday, total, takenCount, isTaken, toggle } = useTodayMeds()
  const todaySym = useLiveQuery(() => db.symptoms.where('date').equals(today).first(), [today])
  const topSym = Object.entries(todaySym?.scores ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 3)

  const preg = due ? pregnancyWeek(due) : null
  const dateLabel = new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })
  const doses = dueToday
    .flatMap(m => m.times.map(t => ({ m, t })))
    .sort((a, b) => a.t.localeCompare(b.t))

  return (
    <div className="space-y-3">
      <header className="flex items-start justify-between pt-2 pb-3">
        <div>
          <p className="text-[13px] font-medium text-muted capitalize">{dateLabel}</p>
          <h1 className="text-[30px] font-bold tracking-tight">{greeting()} ✨</h1>
        </div>
        <Link to="/ayarlar" aria-label="Ayarlar" className="grid size-11 place-items-center rounded-full border border-line bg-surface/80 text-muted active:bg-surface-2">
          <Settings size={20} />
        </Link>
      </header>

      {preg ? (
        <Card className="relative overflow-hidden p-5">
          <div className="absolute -right-16 -top-16 size-48 rounded-full bg-violet/20 blur-3xl" />
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
        </Card>
      ) : dueRow === undefined ? (
        <div className="h-[174px]" />
      ) : (
        <Card onClick={() => nav('/ayarlar')} className="relative overflow-hidden p-5">
          <div className="absolute -right-16 -top-16 size-48 rounded-full bg-violet/20 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <div className="flex-1">
              <p className="font-semibold text-lg">Hoş geldin 💕</p>
              <p className="text-sm text-muted">Haftayı takip etmek için tahmini doğum tarihini gir.</p>
            </div>
            <ChevronRight size={20} className="text-faint" />
          </div>
        </Card>
      )}

      <Card onClick={() => nav('/saglik/semptomlar?gorunum=gunluk')}>
        <div className="flex items-center gap-3">
          {todaySym?.mood
            ? <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-violet/15 text-[24px]">{MOODS[todaySym.mood - 1]}</span>
            : <IconBadge icon={Activity} tone="rose" />}
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Bugün nasılsın?</p>
            <p className="truncate text-[13px] text-muted">
              {topSym.length
                ? topSym.map(([n, v]) => `${n} ${v}`).join(' · ')
                : todaySym?.mood ? 'Semptom girilmedi' : 'Semptom ve genel his kaydet'}
            </p>
          </div>
          <ChevronRight size={18} className="text-faint" />
        </div>
      </Card>

      <SectionTitle right={total > 0 && <span className="text-[13px] font-semibold text-muted">{takenCount}/{total}</span>}>
        Bugünün ilaçları
      </SectionTitle>
      {!loaded ? null : doses.length === 0 ? (
        <Card onClick={() => nav('/saglik/ilaclar')}>
          <Empty icon={Pill} title="Bugün ilaç yok" text="İlaç eklemek için dokun." />
        </Card>
      ) : (
        <Card className="p-1.5">
          {doses.map(({ m, t }, i) => {
            const on = isTaken(m, t)
            return (
              <button
                key={`${m.id}-${t}`}
                onClick={() => toggle(m, t)}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left active:bg-surface-2 ${i ? 'border-t border-line/70' : ''}`}
              >
                <span className={`w-12 text-[15px] font-semibold tabular-nums ${on ? 'text-faint' : 'text-ink'}`}>{t}</span>
                <span className={`flex-1 truncate text-[15px] ${on ? 'text-faint line-through' : ''}`}>{m.name}</span>
                <span className={`grid size-7 place-items-center rounded-full border-2 transition ${on ? 'border-mint bg-mint text-bg' : 'border-line'}`}>
                  {on && <Check size={16} strokeWidth={3.5} />}
                </span>
              </button>
            )
          })}
        </Card>
      )}

      <SectionTitle>Sıradaki randevu</SectionTitle>
      <Card onClick={() => nav('/takvim/randevular')}>
        {next ? (
          <div className="flex items-center gap-3">
            <IconBadge icon={CalendarHeart} tone="violet" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{next.title}</p>
              <p className="text-[13px] text-muted">{fmtDateTime(next.at)}</p>
              {next.place && <p className="flex items-center gap-1 text-[12px] text-faint truncate"><MapPin size={12} /> {next.place}</p>}
            </div>
            <ChevronRight size={18} className="text-faint" />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <IconBadge icon={CalendarHeart} tone="violet" />
            <p className="flex-1 text-muted">Yaklaşan randevu yok</p>
            <ChevronRight size={18} className="text-faint" />
          </div>
        )}
      </Card>
    </div>
  )
}
