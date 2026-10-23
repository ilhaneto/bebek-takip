import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { BABY_WEEKS, LAST_WEEK, babySize, babyWeek, comparePhrase, sizeLabel, type BabyWeek } from '../lib/baby'
import { fmtDate } from '../lib/dates'
import { Card, Sheet } from './ui'

function Ring({ value, size, children }: { value: number; size: number; children: ReactNode }) {
  const r = 52, c = 2 * Math.PI * r
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <defs>
          <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ff7a9c" />
            <stop offset="1" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={r} fill="none" stroke="#2a2635" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={r} fill="none" stroke="url(#ring)" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, Math.max(0, value)))}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  )
}

/** Karşılaştırma görseli; hafta ilerledikçe büyür, ilk haftalarda emoji yerine nokta */
export function BabyVisual({ b, px }: { b: BabyWeek; px: number }) {
  if (b.emoji) return <span style={{ fontSize: px, lineHeight: 1 }} className="drop-shadow-[0_6px_16px_rgba(255,122,156,0.35)]">{b.emoji}</span>
  const dot = b.week <= 4 ? 4 : 7
  return <span className="block rounded-full bg-rose shadow-[0_0_14px_4px_rgba(255,122,156,0.5)]" style={{ width: dot, height: dot }} />
}

/** Haftaya göre görsel boyutu: 4. hafta küçük, 40. hafta büyük */
const visualPx = (week: number) => Math.round(30 + (Math.min(Math.max(week, 4), 40) - 4) * (34 / 36))

function WeeksSheet({ open, onClose, current }: { open: boolean; onClose: () => void; current: number }) {
  const ref = useRef<HTMLDivElement>(null)
  // Yalnızca panelin içini kaydır (scrollIntoView tüm sayfayı da kaydırıyor)
  useEffect(() => {
    const el = ref.current
    const box = el?.closest<HTMLElement>('[data-sheet-scroll]')
    if (open && el && box) box.scrollTop = el.offsetTop - box.clientHeight / 2
  }, [open])
  return (
    <Sheet open={open} onClose={onClose} title="Hafta hafta bebeğin">
      <div className="space-y-1.5">
        {BABY_WEEKS.map(b => {
          const now = b.week === Math.min(current, LAST_WEEK)
          const past = b.week < current
          return (
            <div
              key={b.week}
              ref={now ? ref : undefined}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 ${now ? 'bg-rose/15 ring-1 ring-rose/40' : 'bg-surface-2'} ${past ? 'opacity-55' : ''}`}
            >
              <span className={`w-16 shrink-0 whitespace-nowrap text-[13px] font-semibold ${now ? 'text-rose' : 'text-muted'}`}>{b.week}. hafta</span>
              <span className="grid size-10 place-items-center"><BabyVisual b={b} px={26} /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium first-letter:uppercase">{b.name}</p>
                <p className="text-[12px] text-muted">{sizeLabel(b)}</p>
              </div>
              {now && <span className="text-[11px] font-semibold text-rose">Bugün</span>}
            </div>
          )
        })}
        <p className="px-1 pt-2 text-[12px] text-faint">Değerler ortalamadır. 20. haftaya kadar baş–popo, sonrasında baş–topuk boyudur.</p>
      </div>
    </Sheet>
  )
}

export default function WeekCard({ preg, due }: { preg: { week: number; day: number; daysLeft: number }; due: string }) {
  const [open, setOpen] = useState(false)
  const early = preg.week < 4
  const b = babyWeek(preg.week)
  const size = babySize(preg.week, preg.day)
  const trimester = Math.min(3, Math.floor(preg.week / 13) + 1)

  return (
    <>
      <Card onClick={() => setOpen(true)} className="relative overflow-hidden p-4">
        <div className="absolute -right-16 -top-16 size-48 rounded-full bg-violet/20 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <Ring value={(280 - preg.daysLeft) / 280} size={116}>
            <div>
              <div className="text-[32px] font-bold leading-none">{Math.max(0, preg.week)}</div>
              <div className="mt-1 text-[11px] text-muted">hafta {preg.day > 0 && `+${preg.day}g`}</div>
            </div>
          </Ring>
          <div className="flex min-w-0 flex-1 flex-col items-center text-center">
            <div className="grid h-[76px] place-items-center">
              {early ? <span className="text-[34px]">🌱</span> : <BabyVisual b={b} px={visualPx(preg.week)} />}
            </div>
            <p className="mt-1 text-[12px] text-muted">{early ? 'Yolculuk yeni başlıyor' : 'Bugün'}</p>
            {!early && <p className="text-[15px] font-semibold leading-snug">{comparePhrase(b)}</p>}
            {!early && <p className="text-[12px] text-faint">~{sizeLabel(size)}</p>}
          </div>
        </div>
        <div className="relative mt-3 flex items-center justify-between border-t border-line/70 pt-3 text-[13px]">
          <span>
            <b>{preg.daysLeft > 0 ? `${preg.daysLeft} gün` : 'Zamanı geldi 💕'}</b>
            <span className="text-muted"> · {trimester}. trimester · {fmtDate(due)}</span>
          </span>
          <span className="flex items-center text-muted">Haftalar <ChevronRight size={16} /></span>
        </div>
      </Card>
      <WeeksSheet open={open} onClose={() => setOpen(false)} current={preg.week} />
    </>
  )
}
