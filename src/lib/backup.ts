import { db, TABLES } from '../db'
import { downloadFile } from './ics'

export async function exportBackup() {
  const data: Record<string, unknown[]> = {}
  for (const t of TABLES) data[t] = await db.table(t).toArray()
  downloadFile(`bebek-takip-yedek-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data), 'application/json')
}

export async function importBackup(file: File) {
  const data = JSON.parse(await file.text()) as Record<string, unknown[]>
  await db.transaction('rw', TABLES.map(t => db.table(t)), async () => {
    for (const t of TABLES) {
      await db.table(t).clear()
      if (Array.isArray(data[t])) await db.table(t).bulkAdd(data[t])
    }
  })
}
