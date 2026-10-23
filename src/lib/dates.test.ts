import { expect, test } from 'vitest'
import { pregnancyWeek } from './dates'

test('doğuma 280 gün kala 0. hafta', () => {
  expect(pregnancyWeek('2027-01-01', new Date('2026-03-27T12:00:00'))).toMatchObject({ week: 0, day: 0, daysLeft: 280 })
})
test('doğuma 7 gün kala 39. hafta', () => {
  expect(pregnancyWeek('2027-01-08', new Date('2027-01-01T12:00:00'))).toMatchObject({ week: 39, day: 0, daysLeft: 7 })
})
