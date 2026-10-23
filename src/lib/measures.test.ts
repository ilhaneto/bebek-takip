import { expect, test } from 'vitest'
import { formatValue, parseNum, validate } from './measures'
import { normalizeBackup } from './backup'

test('sayı ayrıştırma', () => {
  expect(parseNum('64,5')).toBe(64.5)
  expect(parseNum('64.5')).toBe(64.5)
  expect(parseNum('')).toBeNull()
})

test('doğrulama', () => {
  expect(validate('kilo', 64.5, null)).toBeNull()
  expect(validate('kilo', 5, null)).not.toBeNull()
  expect(validate('tansiyon', 120, 80)).toBeNull()
  expect(validate('tansiyon', 80, 120)).not.toBeNull()
  expect(validate('tansiyon', 120, null)).not.toBeNull()
  expect(validate('tsh', 2.15, null)).toBeNull()
  expect(validate('tsh', 0, null)).not.toBeNull()
})

test('TSH ondalıkları korunur', () => {
  expect(formatValue({ type: 'tsh', value: 0.045 })).toBe('0,045')
  expect(formatValue({ type: 'tsh', value: 2.5 })).toBe('2,5')
})

test('biçimlendirme', () => {
  expect(formatValue({ type: 'tansiyon', value: 120, value2: 80 })).toBe('120/80')
  expect(formatValue({ type: 'kilo', value: 64.5 })).toBe('64,5')
})

test('eski yedekte kilo kayıtları ölçümlere çevrilir', () => {
  const out = normalizeBackup({ weights: [{ id: 1, date: '2026-10-01', kg: 62 }] })
  expect(out.measurements).toEqual([{ type: 'kilo', date: '2026-10-01', value: 62 }])
  expect(out.weights).toHaveLength(1)
})

test('yeni yedekteki ölçümlere dokunulmaz', () => {
  const m = [{ id: 3, type: 'seker', date: '2026-10-01', value: 90 }]
  expect(normalizeBackup({ weights: [], measurements: m }).measurements).toBe(m)
})
