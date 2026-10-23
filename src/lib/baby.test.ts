import { expect, test } from 'vitest'
import { BABY_WEEKS, babySize, babyWeek, comparePhrase, dueFromLmp, lmpFromDue, sizeLabel } from './baby'
import { pregnancyWeek } from './dates'

test('her hafta 4–40 arası sırayla tanımlı ve boy/kilo artıyor', () => {
  BABY_WEEKS.forEach((b, i) => {
    expect(b.week).toBe(4 + i)
    if (i) {
      expect(b.cm).toBeGreaterThanOrEqual(BABY_WEEKS[i - 1].cm)
      expect(b.g).toBeGreaterThanOrEqual(BABY_WEEKS[i - 1].g)
    }
  })
  expect(BABY_WEEKS).toHaveLength(37)
})

test('sınır dışı haftalar sabitlenir', () => {
  expect(babyWeek(2).week).toBe(4)
  expect(babyWeek(42).week).toBe(40)
})

test('boy gün gün iki hafta arasında ilerler', () => {
  expect(babySize(15, 0).cm).toBe(10.1)
  expect(babySize(15, 7 / 2).cm).toBeCloseTo((10.1 + 11.6) / 2)
  expect(babySize(40, 3).cm).toBe(51.2)
})

test('etiket ve cümle', () => {
  expect(sizeLabel({ cm: 0.2, g: 0 })).toBe('2 mm')
  expect(sizeLabel({ cm: 42.4, g: 1700 })).toBe('42,4 cm · 1,7 kg')
  expect(comparePhrase(babyWeek(32))).toBe('Bebeğin bir kavun kadar')
})

test('son adet tarihi ↔ doğum tarihi ve hafta', () => {
  expect(dueFromLmp('2026-09-14')).toBe('2027-06-21')
  expect(lmpFromDue('2027-06-21')).toBe('2026-09-14')
  // SAT'tan 5 hafta 4 gün sonra
  expect(pregnancyWeek(dueFromLmp('2026-09-14'), new Date('2026-10-23T12:00:00'))).toMatchObject({ week: 5, day: 4 })
})
