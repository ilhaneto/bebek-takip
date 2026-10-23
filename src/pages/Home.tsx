import { Link, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Activity, CalendarHeart, Check, ChevronRight, MapPin, Pill, Settings } from 'lucide-react'
import { MOODS } from '../lib/symptoms'
import { usePregnancyDates } from '../lib/baby'
import WeekCard from '../components/WeekCard'
import { db } from '../db'
import { fmtDateTime, nowLocal, pregnancyWeek } from '../lib/dates'
import { useTodayMeds } from '../lib/useTodayMeds'
import { Card, Empty, IconBadge, SectionTitle } from '../components/ui'

const greeting = () => {
  const h = new Date().getHours()
  return h < 6 ? 'İyi geceler' : h < 12 ? 'Günaydın' : h < 18 ? 'İyi günler' : 'İyi akşamlar'
}

export default function Home() {
  const nav = useNavigate()
  const dates = usePregnancyDates()
  const next = useLiveQuery(
    () => db.appointments.where('at').aboveOrEqual(nowLocal()).first(),
    [],
  )
  const { loaded, today, dueToday, total, takenCount, isTaken, toggle } = useTodayMeds()
  const todaySym = useLiveQuery(() => db.symptoms.where('date').equals(today).first(), [today])
  const topSym = Object.entries(todaySym?.scores ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 3)

  const preg = dates ? pregnancyWeek(dates.due) : null
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

      {preg && <WeekCard preg={preg} due={dates!.due} />}

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
