import Dexie, { type EntityTable } from 'dexie'

export interface Med { id: number; name: string; dose: string; times: string[]; active: boolean }
export interface MedLog { id: number; medId: number; date: string; time: string; takenAt: number }
export interface Note { id: number; text: string; tag: string; createdAt: number }
export interface Appointment {
  id: number; title: string; doctor: string; place: string
  at: string // yerel "YYYY-MM-DDTHH:mm"
  questions: string; result: string
}
export interface Weight { id: number; date: string; kg: number }
export interface Setting { key: string; value: string }

export const db = new Dexie('bebektakip') as Dexie & {
  meds: EntityTable<Med, 'id'>
  medLogs: EntityTable<MedLog, 'id'>
  notes: EntityTable<Note, 'id'>
  appointments: EntityTable<Appointment, 'id'>
  weights: EntityTable<Weight, 'id'>
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

export const TABLES = ['meds', 'medLogs', 'notes', 'appointments', 'weights', 'settings'] as const
