const pad = (n: number) => String(n).padStart(2, '0')

/** Yerel saate göre YYYY-MM-DD */
export function ymd(d = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function fmtDateTime(local: string): string {
  return new Date(local).toLocaleString('tr-TR', {
    day: 'numeric', month: 'long', weekday: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export function fmtDate(s: string): string {
  return new Date(s + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
}

/** Tahmini doğum tarihinden (HPT) gebelik haftası ve günü. 40 hafta = 280 gün. */
export function pregnancyWeek(due: string, now = new Date()): { week: number; day: number; daysLeft: number } {
  const dueMs = new Date(due + 'T00:00:00').getTime()
  const today = new Date(ymd(now) + 'T00:00:00').getTime()
  const daysLeft = Math.round((dueMs - today) / 86400000)
  const elapsed = 280 - daysLeft
  return { week: Math.floor(elapsed / 7), day: elapsed % 7, daysLeft }
}
