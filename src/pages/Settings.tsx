import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BellDot, ChevronLeft, ChevronRight, Download, Upload } from 'lucide-react'
import { savePregnancyDates, usePregnancyDates } from '../lib/baby'
import { exportBackup, importBackup } from '../lib/backup'
import { disableBadge, enableBadge, useBadgeSetting } from '../lib/badge'
import { Card, IconBadge, Input, Label, SectionTitle } from '../components/ui'

export default function Settings() {
  const nav = useNavigate()
  const dates = usePregnancyDates()
  const fileRef = useRef<HTMLInputElement>(null)
  const badgeOn = useBadgeSetting()
  const [badgeMsg, setBadgeMsg] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      <header className="flex items-center gap-2 pt-2 pb-3">
        <button onClick={() => nav(-1)} aria-label="Geri" className="grid size-10 place-items-center rounded-full text-muted active:bg-surface-2">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-[26px] font-bold tracking-tight">Ayarlar</h1>
      </header>

      <SectionTitle>Gebelik</SectionTitle>
      <Card className="space-y-3">
        <div>
          <Label>Son adet tarihi</Label>
          <Input type="date" value={dates?.lmp ?? ''} onChange={e => e.target.value && savePregnancyDates({ lmp: e.target.value })} />
        </div>
        <div>
          <Label>Tahmini doğum tarihi</Label>
          <Input type="date" value={dates?.due ?? ''} onChange={e => e.target.value && savePregnancyDates({ due: e.target.value })} />
        </div>
        <p className="px-1 text-[12px] text-faint">
          Biri değişince diğeri 280 gün farkla güncellenir. Doktor ultrasona göre farklı bir doğum tarihi verdiyse doğum tarihini değiştirmen yeterli.
        </p>
      </Card>

      <SectionTitle>Uygulama simgesi</SectionTitle>
      <Card>
        <div className="flex items-center gap-3">
          <IconBadge icon={BellDot} tone="rose" />
          <div className="flex-1">
            <p className="font-semibold">Simgede kalan günü göster</p>
            <p className="text-[13px] text-muted">Ana ekrandaki simgenin köşesinde doğuma kalan gün yazar</p>
          </div>
          <button
            role="switch"
            aria-checked={!!badgeOn}
            aria-label="Simgede kalan günü göster"
            onClick={async () => setBadgeMsg(badgeOn ? (await disableBadge(), null) : await enableBadge(dates?.due))}
            className={`relative h-8 w-14 shrink-0 rounded-full transition ${badgeOn ? 'bg-gradient-to-r from-rose to-violet' : 'bg-line'}`}
          >
            <span className={`absolute top-1 size-6 rounded-full bg-white shadow transition-all ${badgeOn ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
        {badgeMsg && <p className="mt-3 rounded-2xl bg-amber/10 p-3 text-[13px] text-amber">{badgeMsg}</p>}
        <p className="mt-3 px-1 text-[12px] text-faint">
          iOS bunun için bildirim izni ister. Sayı uygulamayı her açtığında güncellenir; birkaç gün açmazsan eski sayı görünebilir.
        </p>
      </Card>

      <SectionTitle>Veriler</SectionTitle>
      <Card className="p-2">
        <button onClick={exportBackup} className="flex w-full items-center gap-3 rounded-2xl p-2.5 active:bg-surface-2">
          <IconBadge icon={Download} tone="mint" />
          <div className="flex-1 text-left">
            <p className="font-semibold">Yedek al</p>
            <p className="text-[13px] text-muted">Başka telefona taşımak için AirDrop, Dosyalar ya da WhatsApp ile gönder</p>
          </div>
          <ChevronRight size={18} className="text-faint" />
        </button>
        <div className="mx-3 h-px bg-line" />
        <button onClick={() => fileRef.current?.click()} className="flex w-full items-center gap-3 rounded-2xl p-2.5 active:bg-surface-2">
          <IconBadge icon={Upload} tone="amber" />
          <div className="flex-1 text-left">
            <p className="font-semibold">Yedekten geri yükle</p>
            <p className="text-[13px] text-muted">Dosyalar'dan yedek dosyasını seç; mevcut verilerin yerine geçer</p>
          </div>
          <ChevronRight size={18} className="text-faint" />
        </button>
      </Card>
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        hidden
        onChange={async e => {
          const f = e.target.files?.[0]
          if (f && confirm('Mevcut veriler silinip yedek yüklenecek. Emin misin?')) await importBackup(f)
          e.target.value = ''
        }}
      />

      <p className="pt-4 text-center text-[12px] text-faint">ilhanbaby · kişisel kullanım</p>
    </div>
  )
}
