import { useLiveQuery } from 'dexie-react-hooks'
import { db, type SymptomDay } from '../db'

export const DEFAULT_SYMPTOMS = ['Bulantı', 'Kusma', 'Yorgunluk', 'Kasık ağrısı', 'Kabızlık', 'Bel ağrısı', 'Ödem']

export const MOODS = ['😣', '😕', '😐', '🙂', '😊']
export const SCORE_LABELS = ['', 'Hafif', 'Az', 'Orta', 'Belirgin', 'Çok şiddetli']

const LIST_KEY = 'symptomList'

/** Takip edilen semptom listesi (ayarlarda saklanır, yoksa varsayılan) */
export function useSymptomList(): string[] | undefined {
  return useLiveQuery(async () => {
    const row = await db.settings.get(LIST_KEY)
    return row ? (JSON.parse(row.value) as string[]) : DEFAULT_SYMPTOMS
  }, [])
}

export const saveSymptomList = (list: string[]) => db.settings.put({ key: LIST_KEY, value: JSON.stringify(list) })

/** Aynı puana tekrar dokunulursa puanı kaldırır */
export function nextScores(scores: Record<string, number>, name: string, value: number): Record<string, number> {
  const out = { ...scores }
  if (out[name] === value) delete out[name]
  else out[name] = value
  return out
}

/** Gün kaydını oluşturur ya da günceller; tamamen boşalırsa da kayıt kalır (geçmiş silinmez). */
export async function saveDay(date: string, patch: Partial<Omit<SymptomDay, 'id' | 'date'>>) {
  const existing = await db.symptoms.where('date').equals(date).first()
  if (existing) await db.symptoms.update(existing.id, patch)
  else await db.symptoms.add({ date, scores: {}, ...patch } as never)
}

const utc = (d: string) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10))
const fromUtc = (t: number) => new Date(t).toISOString().slice(0, 10)

export const shiftDay = (d: string, by: number) => fromUtc(utc(d) + by * 86400000)

/** end dahil, geriye doğru n gün; eskiden yeniye */
export const lastDays = (end: string, n: number) => Array.from({ length: n }, (_, i) => shiftDay(end, i - (n - 1)))

/** Isı haritası hücre rengi: 1 soluk → 5 yoğun gül rengi */
export const scoreColor = (v?: number) => (v ? `rgb(255 122 156 / ${0.12 + v * 0.17})` : 'transparent')
