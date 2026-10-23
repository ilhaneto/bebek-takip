import type { Measurement, MeasureType } from '../db'

export const SUGAR_TAGS = ['Açlık', 'Tokluk 1. saat', 'Tokluk 2. saat', 'Rastgele']

export const MEASURES: Record<MeasureType, { label: string; unit: string; placeholder: string; withTime: boolean; digits: number }> = {
  kilo: { label: 'Kilo', unit: 'kg', placeholder: '64,5', withTime: false, digits: 1 },
  tansiyon: { label: 'Tansiyon', unit: 'mmHg', placeholder: '120', withTime: true, digits: 0 },
  tsh: { label: 'TSH', unit: 'mIU/L', placeholder: '2,15', withTime: false, digits: 3 },
  seker: { label: 'Şeker', unit: 'mg/dL', placeholder: '90', withTime: true, digits: 0 },
}

/** Yeni kayıt girilebilen türler; şeker yalnızca eski kayıtlar için görünür. */
export const ENTRY_TYPES: MeasureType[] = ['kilo', 'tansiyon', 'tsh']

/** "64,5" veya "64.5" → 64.5; geçersizse null */
export function parseNum(s: string): number | null {
  const v = parseFloat(s.trim().replace(',', '.'))
  return Number.isFinite(v) ? v : null
}

const LIMITS: Record<MeasureType, [number, number]> = { kilo: [20, 250], tansiyon: [40, 260], tsh: [0.001, 100], seker: [20, 600] }

/** Form değerlerini doğrular; hata varsa mesaj döner */
export function validate(type: MeasureType, value: number | null, value2: number | null): string | null {
  const [lo, hi] = LIMITS[type]
  if (value === null || value < lo || value > hi) return `${MEASURES[type].label} için ${lo.toLocaleString('tr-TR')}–${hi} arasında bir değer gir.`
  if (type === 'tansiyon') {
    if (value2 === null || value2 < 20 || value2 > 200) return 'Küçük tansiyon için 20–200 arasında bir değer gir.'
    if (value2 >= value) return 'Küçük tansiyon büyükten düşük olmalı.'
  }
  return null
}

const n = (v: number, digits: number) => v.toLocaleString('tr-TR', { maximumFractionDigits: digits })

export function formatValue(m: Pick<Measurement, 'type' | 'value' | 'value2'>): string {
  const d = MEASURES[m.type].digits
  return m.type === 'tansiyon' ? `${n(m.value, d)}/${n(m.value2 ?? 0, d)}` : n(m.value, d)
}

/** Grafik ve geçmiş için tarih + saate göre eskiden yeniye */
export const byTime = (a: Measurement, b: Measurement) =>
  (a.date + (a.time ?? '')).localeCompare(b.date + (b.time ?? '')) || a.id - b.id
