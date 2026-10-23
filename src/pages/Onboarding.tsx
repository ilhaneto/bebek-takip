import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { fmtDate, pregnancyWeek, ymd } from '../lib/dates'
import { babyWeek, comparePhrase, dueFromLmp, savePregnancyDates } from '../lib/baby'
import { importBackup } from '../lib/backup'
import { shiftDay } from '../lib/symptoms'
import { Button, Card, Input, Label } from '../components/ui'

/** İlk açılış: son adet tarihi (ya da doktorun verdiği doğum tarihi) girilir. */
export default function Onboarding() {
  const today = ymd()
  const [mode, setMode] = useState<'lmp' | 'due'>('lmp')
  const [value, setValue] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const due = value ? (mode === 'lmp' ? dueFromLmp(value) : value) : null
  const preg = due ? pregnancyWeek(due) : null
  const error = !preg ? null
    : preg.week < 0 ? (mode === 'lmp' ? 'Son adet tarihi bugünden sonra olamaz.' : 'Bu doğum tarihi 40 haftadan daha uzakta.')
    : preg.week > 42 ? 'Bu tarihe göre gebelik 42 haftayı geçmiş görünüyor, tarihi kontrol et.'
    : null
  const b = preg && !error ? babyWeek(preg.week) : null

  return (
    <div className="mx-auto flex min-h-[90vh] max-w-md flex-col justify-center gap-5 px-4 py-8">
      <div className="text-center">
        <div className="mx-auto mb-4 grid size-28 place-items-center rounded-full bg-gradient-to-br from-rose/25 to-violet/25 text-[56px] shadow-2xl shadow-rose/20">
          {b?.emoji ?? '🌱'}
        </div>
        <h1 className="text-[28px] font-bold tracking-tight">Hoş geldin 💕</h1>
        <p className="mt-1 text-[15px] text-muted">Haftanı ve bebeğinin büyüklüğünü hesaplamak için bir tarih gir.</p>
      </div>

      <Card className="space-y-3 p-5">
        <Label>{mode === 'lmp' ? 'Son adet tarihinin ilk günü' : 'Doktorun verdiği tahmini doğum tarihi'}</Label>
        <Input
          type="date"
          value={value}
          max={mode === 'lmp' ? today : undefined}
          min={mode === 'lmp' ? shiftDay(today, -300) : today}
          onChange={e => setValue(e.target.value)}
        />
        {preg && (error
          ? <p className="text-[13px] text-amber">{error}</p>
          : (
            <div className="rounded-2xl bg-surface-2 p-3 text-[14px]">
              <p><b>{preg.week} hafta {preg.day} gün</b> hamilesin</p>
              <p className="text-muted">Tahmini doğum: {fmtDate(due!)} {due!.slice(0, 4)}</p>
              {b && <p className="text-muted">{comparePhrase(b)}</p>}
            </div>
          ))}
        <Button className="w-full" disabled={!due || !!error} onClick={() => savePregnancyDates(mode === 'lmp' ? { lmp: value } : { due: value })}>
          Başla
        </Button>
        <button className="w-full pt-1 text-[13px] font-medium text-muted" onClick={() => { setMode(mode === 'lmp' ? 'due' : 'lmp'); setValue('') }}>
          {mode === 'lmp' ? 'Doktorun verdiği doğum tarihini biliyorum' : 'Son adet tarihiyle hesapla'}
        </button>
      </Card>

      <button onClick={() => fileRef.current?.click()} className="mx-auto flex items-center gap-2 text-[13px] text-faint">
        <Upload size={14} /> Başka cihazdan yedeği yükle
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        hidden
        onChange={async e => {
          const f = e.target.files?.[0]
          if (f) await importBackup(f)
          e.target.value = ''
        }}
      />
      <p className="text-center text-[12px] text-faint">Veriler yalnızca bu cihazda saklanır. Tarihi sonra Ayarlar'dan değiştirebilirsin.</p>
    </div>
  )
}
