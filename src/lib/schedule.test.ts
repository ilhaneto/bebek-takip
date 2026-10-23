import { expect, test } from 'vitest'
import type { Med } from '../db'
import { firstDueFrom, isDueOn, rrule, scheduleLabel } from './schedule'

const med = (schedule?: Med['schedule']): Med => ({ id: 1, name: 'Levotiron 150', times: ['07:00'], active: true, schedule })

// 2026-10-26 Pazartesi
test('haftalık: Pzt/Çar/Cum', () => {
  const m = med({ type: 'weekly', days: [1, 3, 5] })
  expect(isDueOn(m, '2026-10-26')).toBe(true)
  expect(isDueOn(m, '2026-10-27')).toBe(false)
  expect(isDueOn(m, '2026-10-28')).toBe(true)
  expect(rrule(m)).toBe('RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR')
  expect(scheduleLabel(m)).toBe('Pzt, Çar, Cum')
  expect(firstDueFrom(m, '2026-10-27')).toBe('2026-10-28')
})

test('tamamlayıcı günler: Sal/Per/Cmt/Paz', () => {
  const m = med({ type: 'weekly', days: [2, 4, 6, 0] })
  expect(isDueOn(m, '2026-11-01')).toBe(true) // Pazar
  expect(rrule(m)).toBe('RRULE:FREQ=WEEKLY;BYDAY=TU,TH,SA,SU')
})

test('N günde bir', () => {
  const m = med({ type: 'interval', every: 3, start: '2026-10-26' })
  expect(isDueOn(m, '2026-10-26')).toBe(true)
  expect(isDueOn(m, '2026-10-28')).toBe(false)
  expect(isDueOn(m, '2026-10-29')).toBe(true)
  expect(isDueOn(m, '2026-10-23')).toBe(false)
  expect(firstDueFrom(m, '2026-10-23')).toBe('2026-10-26')
  expect(rrule(m)).toBe('RRULE:FREQ=DAILY;INTERVAL=3')
})

test('eski kayıt her gün sayılır', () => {
  expect(isDueOn(med(), '2026-10-27')).toBe(true)
  expect(rrule(med())).toBe('RRULE:FREQ=DAILY')
})
