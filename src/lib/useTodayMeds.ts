import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Med } from '../db'
import { ymd } from './dates'
import { isDueOn } from './schedule'

/** Bugünün ilaçları ve "alındı" işaretleme; İlaçlar ve Bugün sayfaları ortak kullanır. */
export function useTodayMeds() {
  const today = ymd()
  const loadedMeds = useLiveQuery(() => db.meds.toArray(), [])
  const loaded = loadedMeds !== undefined
  const allMeds = loadedMeds ?? []
  const logs = useLiveQuery(() => db.medLogs.where('date').equals(today).toArray(), [today]) ?? []
  const meds = allMeds.filter(m => m.active)
  const dueToday = meds.filter(m => isDueOn(m, today))
  const total = dueToday.reduce((n, m) => n + m.times.length, 0)
  const takenCount = logs.filter(l => dueToday.some(m => m.id === l.medId && m.times.includes(l.time))).length

  const isTaken = (m: Med, time: string) => logs.some(l => l.medId === m.id && l.time === time)

  async function toggle(m: Med, time: string) {
    const existing = logs.find(l => l.medId === m.id && l.time === time)
    if (existing) await db.medLogs.delete(existing.id)
    else await db.medLogs.add({ medId: m.id, date: today, time, takenAt: Date.now(), name: m.name } as never)
  }

  return { loaded, today, allMeds, meds, dueToday, total, takenCount, isTaken, toggle }
}
