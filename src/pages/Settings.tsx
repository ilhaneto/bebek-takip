import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, ChevronRight, Download, Upload } from 'lucide-react'
import { db } from '../db'
import { exportBackup, importBackup } from '../lib/backup'
import { Card, IconBadge, Input, Label, SectionTitle } from '../components/ui'

export default function Settings() {
  const nav = useNavigate()
  const due = useLiveQuery(() => db.settings.get('dueDate'), [])?.value
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-3">
      <header className="flex items-center gap-2 pt-2 pb-3">
        <button onClick={() => nav(-1)} aria-label="Geri" className="grid size-10 place-items-center rounded-full text-muted active:bg-surface-2">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-[26px] font-bold tracking-tight">Ayarlar</h1>
      </header>

      <SectionTitle>Gebelik</SectionTitle>
      <Card>
        <Label>Tahmini doğum tarihi</Label>
        <Input type="date" value={due ?? ''} onChange={e => db.settings.put({ key: 'dueDate', value: e.target.value })} />
        <p className="px-1 pt-2 text-[12px] text-faint">Hafta ve kalan gün bu tarihten hesaplanır.</p>
      </Card>

      <SectionTitle>Veriler</SectionTitle>
      <Card className="p-2">
        <button onClick={exportBackup} className="flex w-full items-center gap-3 rounded-2xl p-2.5 active:bg-surface-2">
          <IconBadge icon={Download} tone="mint" />
          <div className="flex-1 text-left">
            <p className="font-semibold">Yedek al</p>
            <p className="text-[13px] text-muted">Veriler yalnızca bu telefonda durur</p>
          </div>
          <ChevronRight size={18} className="text-faint" />
        </button>
        <div className="mx-3 h-px bg-line" />
        <button onClick={() => fileRef.current?.click()} className="flex w-full items-center gap-3 rounded-2xl p-2.5 active:bg-surface-2">
          <IconBadge icon={Upload} tone="amber" />
          <div className="flex-1 text-left">
            <p className="font-semibold">Yedekten geri yükle</p>
            <p className="text-[13px] text-muted">Mevcut verilerin yerine geçer</p>
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

      <p className="pt-4 text-center text-[12px] text-faint">Bebek Takip · kişisel kullanım</p>
    </div>
  )
}
