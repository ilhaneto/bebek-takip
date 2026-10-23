import Dexie, { type EntityTable } from 'dexie'

/** Haftanın günleri JS getDay() ile: 0 = Pazar … 6 = Cumartesi */
export type Schedule =
  | { type: 'daily' }
  | { type: 'weekly'; days: number[] }
  | { type: 'interval'; every: number; start: string }

export interface Med {
  id: number; name: string; times: string[]; active: boolean
  dose?: string // eski alan; v2'de ada taşındı
  schedule?: Schedule // eski kayıtlarda yok = her gün
  remindBefore?: number // dakika; yoksa 60
  endedAt?: string // ilaç bırakıldıysa tarih; kayıt ve geçmiş saklanır
  rev?: number // her düzenlemede artar, takvim SEQUENCE değeri
}
/** name alındığı andaki ilaç adıdır; ilaç sonradan düzenlense de geçmiş değişmez. dose yalnızca eski kayıtlarda var. */
export interface MedLog { id: number; medId: number; date: string; time: string; takenAt: number; name?: string; dose?: string }
export interface Note { id: number; text: string; tag: string; createdAt: number }
export interface Appointment {
  id: number; title: string; doctor: string; place: string
  at: string // yerel "YYYY-MM-DDTHH:mm"
  questions: string; result: string
}
/** Eski kilo tablosu; v3'te measurements'a kopyalandı, silinmedi. */
export interface Weight { id: number; date: string; kg: number }
export type MeasureType = 'kilo' | 'tansiyon' | 'seker'
export interface Measurement {
  id: number; type: MeasureType; date: string
  time?: string // "HH:mm"
  value: number // kilo: kg, tansiyon: büyük, şeker: mg/dL
  value2?: number // tansiyon: küçük
  tag?: string // şeker: Açlık / Tokluk…
  note?: string
}
export interface Setting { key: string; value: string }

export const db = new Dexie('bebektakip') as Dexie & {
  meds: EntityTable<Med, 'id'>
  medLogs: EntityTable<MedLog, 'id'>
  notes: EntityTable<Note, 'id'>
  appointments: EntityTable<Appointment, 'id'>
  weights: EntityTable<Weight, 'id'>
  measurements: EntityTable<Measurement, 'id'>
  settings: EntityTable<Setting, 'key'>
}

db.version(1).stores({
  meds: '++id',
  medLogs: '++id, medId, date',
  notes: '++id, createdAt',
  appointments: '++id, at',
  weights: '++id, date',
  settings: 'key',
})

/** Doz alanı kaldırıldı: dozu ilaç adının sonuna ekler. */
export function mergeDose<T extends { name: string; dose?: string }>(m: T): T {
  if (!m.dose?.trim()) return m
  const { dose, ...rest } = m
  return { ...rest, name: `${m.name} ${dose.trim()}` } as T
}

db.version(2).stores({}).upgrade(tx =>
  tx.table('meds').toCollection().modify((m: Med) => {
    if (m.dose?.trim()) m.name = `${m.name} ${m.dose.trim()}`
    delete m.dose
  }),
)

export const weightToMeasurement = (w: Weight): Omit<Measurement, 'id'> => ({ type: 'kilo', date: w.date, value: w.kg })

// Kilo kayıtları ortak ölçüm tablosuna kopyalanır; eski tablo yedek olarak kalır.
db.version(3).stores({ measurements: '++id, type, date' }).upgrade(async tx => {
  const weights: Weight[] = await tx.table('weights').toArray()
  await tx.table('measurements').bulkAdd(weights.map(weightToMeasurement))
})

export const TABLES = ['meds', 'medLogs', 'notes', 'appointments', 'weights', 'measurements', 'settings'] as const
