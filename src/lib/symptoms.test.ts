import { expect, test } from 'vitest'
import { lastDays, nextScores, shiftDay } from './symptoms'

test('gün kaydırma ay ve yıl sınırında', () => {
  expect(shiftDay('2026-10-31', 1)).toBe('2026-11-01')
  expect(shiftDay('2027-01-01', -1)).toBe('2026-12-31')
})

test('son n gün eskiden yeniye', () => {
  expect(lastDays('2026-10-23', 3)).toEqual(['2026-10-21', '2026-10-22', '2026-10-23'])
})

test('puan verme, değiştirme, aynı puana dokununca kaldırma', () => {
  let s = nextScores({}, 'Bulantı', 3)
  expect(s).toEqual({ Bulantı: 3 })
  s = nextScores(s, 'Bulantı', 5)
  expect(s).toEqual({ Bulantı: 5 })
  s = nextScores(s, 'Bulantı', 5)
  expect(s).toEqual({})
})
