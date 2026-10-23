import type { Med, Schedule } from '../db'

export const DEFAULT_REMIND = 60

/** Pazartesiden başlayan sıra, değerler getDay() karşılığı */
export const WEEK = [
  { d: 1, short: 'Pzt', ical: 'MO' },
  { d: 2, short: 'Sal', ical: 'TU' },
  { d: 3, short: 'Çar', ical: 'WE' },
  { d: 4, short: 'Per', ical: 'TH' },
  { d: 5, short: 'Cum', ical: 'FR' },
  { d: 6, short: 'Cmt', ical: 'SA' },
  { d: 0, short: 'Paz', ical: 'SU' },
]

export const scheduleOf = (m: Med): Schedule => m.schedule ?? { type: 'daily' }

const dayMs = 86400000
const toDay = (ymd: string) => Date.UTC(+ymd.slice(0, 4), +ymd.slice(5, 7) - 1, +ymd.slice(8, 10))
const fromDay = (ms: number) => new Date(ms).toISOString().slice(0, 10)

export function isDueOn(m: Med, ymd: string): boolean {
  const s = scheduleOf(m)
  if (s.type === 'daily') return true
  if (s.type === 'weekly') return s.days.includes(new Date(toDay(ymd)).getUTCDay())
  const diff = Math.round((toDay(ymd) - toDay(s.start)) / dayMs)
  return diff >= 0 && diff % s.every === 0
}

/** Verilen günden itibaren ilacın ilk alınacağı gün */
export function firstDueFrom(m: Med, ymd: string): string {
  const s = scheduleOf(m)
  if (s.type === 'interval' && toDay(s.start) > toDay(ymd)) return s.start
  for (let i = 0; i < 366; i++) {
    const d = fromDay(toDay(ymd) + i * dayMs)
    if (isDueOn(m, d)) return d
  }
  return ymd
}

export function scheduleLabel(m: Med): string {
  const s = scheduleOf(m)
  if (s.type === 'daily') return 'Her gün'
  if (s.type === 'interval') return s.every === 1 ? 'Her gün' : `${s.every} günde bir`
  if (s.days.length === 7) return 'Her gün'
  return WEEK.filter(w => s.days.includes(w.d)).map(w => w.short).join(', ')
}

export function rrule(m: Med): string {
  const s = scheduleOf(m)
  if (s.type === 'weekly' && s.days.length < 7) {
    return `RRULE:FREQ=WEEKLY;BYDAY=${WEEK.filter(w => s.days.includes(w.d)).map(w => w.ical).join(',')}`
  }
  if (s.type === 'interval' && s.every > 1) return `RRULE:FREQ=DAILY;INTERVAL=${s.every}`
  return 'RRULE:FREQ=DAILY'
}

export function remindLabel(min: number): string {
  if (min === 0) return 'Saatinde'
  return min % 60 === 0 ? `${min / 60} saat önce` : `${min} dk önce`
}
