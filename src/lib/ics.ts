import type { Appointment, Med } from '../db'
import { DEFAULT_REMIND, firstDueFrom, remindLabel, rrule } from './schedule'

const stamp = (local: string) => local.replace(/[-:]/g, '').slice(0, 13) + '00'
const nowStamp = () => new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z'
const esc =(s: string) => s.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n')

function wrap(events: string[]): string {
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//BebekTakip//TR', 'METHOD:PUBLISH', ...events, 'END:VCALENDAR'].join('\r\n')
}

function alarm(minutesBefore: number, text: string): string[] {
  return ['BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(text)}`, `TRIGGER:-PT${minutesBefore}M`, 'END:VALARM']
}

/** Her ilaç saati için ilacın tekrar planına göre yinelenen takvim olayı. */
export function medsToIcs(meds: Med[], startDate: string): string {
  const events = meds.filter(m => m.active).flatMap(m => {
    const first = firstDueFrom(m, startDate)
    const before = m.remindBefore ?? DEFAULT_REMIND
    return m.times.map((t, i) => [
      'BEGIN:VEVENT',
      // Aynı UID + artan SEQUENCE: takvim bunu aynı etkinliğin güncel hali olarak görebilir.
      `UID:med-${m.id}-${i}@bebektakip`,
      `SEQUENCE:${m.rev ?? 0}`,
      `DTSTAMP:${nowStamp()}`,
      `DTSTART:${stamp(first + 'T' + t)}`,
      'DURATION:PT10M',
      rrule(m),
      `SUMMARY:${esc(`💊 ${m.name}`)}`,
      ...alarm(before, before ? `${m.name} ${t} – ${remindLabel(before)}` : `${m.name} ilacı zamanı`),
      'END:VEVENT',
    ].join('\r\n'))
  })
  return wrap(events)
}

export function appointmentToIcs(a: Appointment): string {
  const ev = [
    'BEGIN:VEVENT',
    `UID:appt-${a.id}@bebektakip`,
    `DTSTAMP:${nowStamp()}`,
    `DTSTART:${stamp(a.at)}`,
    'DURATION:PT1H',
    `SUMMARY:${esc(`🩺 ${a.title}`)}`,
    `LOCATION:${esc(a.place)}`,
    `DESCRIPTION:${esc(a.doctor ? `Doktor: ${a.doctor}\n${a.questions}` : a.questions)}`,
    ...alarm(1440, `Yarın randevu: ${a.title}`),
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
