import type { Appointment, Med } from '../db'

const stamp = (local: string) => local.replace(/[-:]/g, '').slice(0, 13) + '00'
const esc = (s: string) => s.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n')

function wrap(events: string[]): string {
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//BebekTakip//TR', ...events, 'END:VCALENDAR'].join('\r\n')
}

function alarm(minutesBefore: number, text: string): string[] {
  return ['BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(text)}`, `TRIGGER:-PT${minutesBefore}M`, 'END:VALARM']
}

/** Her ilaç saati için günlük tekrar eden, anında hatırlatan takvim olayı. */
export function medsToIcs(meds: Med[], startDate: string): string {
  const events = meds.filter(m => m.active).flatMap(m =>
    m.times.map((t, i) => [
      'BEGIN:VEVENT',
      `UID:med-${m.id}-${i}@bebektakip`,
      `DTSTAMP:${stamp(startDate + 'T00:00')}Z`,
      `DTSTART:${stamp(startDate + 'T' + t)}`,
      'DURATION:PT10M',
      'RRULE:FREQ=DAILY',
      `SUMMARY:${esc(`💊 ${m.name} ${m.dose}`.trim())}`,
      ...alarm(0, `${m.name} ilacı zamanı`),
      'END:VEVENT',
    ].join('\r\n')),
  )
  return wrap(events)
}

export function appointmentToIcs(a: Appointment): string {
  const ev = [
    'BEGIN:VEVENT',
    `UID:appt-${a.id}@bebektakip`,
    `DTSTAMP:${stamp(a.at)}Z`,
    `DTSTART:${stamp(a.at)}`,
    'DURATION:PT1H',
    `SUMMARY:${esc(`🩺 ${a.title}`)}`,
    `LOCATION:${esc(a.place)}`,
    `DESCRIPTION:${esc(a.doctor ? `Doktor: ${a.doctor}\n${a.questions}` : a.questions)}`,
    ...alarm(1440, 'Yarın randevu var'),
    ...alarm(60, 'Randevuya 1 saat var'),
    'END:VEVENT',
  ].join('\r\n')
  return wrap([ev])
}

export function downloadFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
