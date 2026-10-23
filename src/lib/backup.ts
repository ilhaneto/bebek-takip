import { db, mergeDose, TABLES, weightToMeasurement, type Med, type Weight } from '../db'
import { downloadFile } from './ics'

export async function exportBackup() {
  const data: Record<string, unknown[]> = {}
  for (const t of TABLES) data[t] = await db.table(t).toArray()
  downloadFile(`ilhanbaby-yedek-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data), 'application/json')
}

/** Eski sürüm yedeklerini güncel yapıya çevirir. */
export function normalizeBackup(data: Record<string, unknown[]>): Record<string, unknown[]> {
  const out = { ...data }
  // Doz alanlı eski yedeklerde dozu ada taşı
  if (Array.isArray(out.meds)) out.meds = (out.meds as Med[]).map(mergeDose)
  // Ölçüm tablosundan önceki yedeklerde kilo kayıtlarını ölçümlere kopyala
  if (!Array.isArray(out.measurements) && Array.isArray(out.weights)) {
    out.measurements = (out.weights as Weight[]).map(weightToMeasurement)
  }
  return out
}

export async function importBackup(file: File) {
  const data = normalizeBackup(JSON.parse(await file.text()) as Record<string, unknown[]>)
  await db.transaction('rw', TABLES.map(t => db.table(t)), async () => {
    for (const t of TABLES) {
      await db.table(t).clear()
      if (Array.isArray(data[t])) await db.table(t).bulkAdd(data[t])
    }
  })
}
