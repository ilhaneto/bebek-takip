import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { NotebookPen, Search, Trash2 } from 'lucide-react'
import { db } from '../db'
import { Button, Card, Chip, Empty, Fab, IconButton, Input, PageHeader, Sheet, Textarea } from '../components/ui'

const TAGS = ['Genel', 'Soru', 'Semptom', 'Hatırlatma']
const tagTone: Record<string, string> = {
  Genel: 'text-violet bg-violet/15',
  Soru: 'text-amber bg-amber/15',
  Semptom: 'text-rose bg-rose/15',
  Hatırlatma: 'text-mint bg-mint/15',
}

export default function Notes() {
  const notes = useLiveQuery(() => db.notes.orderBy('createdAt').reverse().toArray(), []) ?? []
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [tag, setTag] = useState(TAGS[0])
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<string | null>(null)

  async function add() {
    if (!text.trim()) return
    await db.notes.add({ text: text.trim(), tag, createdAt: Date.now() } as never)
    setText(''); setOpen(false)
  }

  const shown = notes.filter(n =>
    (!filter || n.tag === filter) && (!q || n.text.toLocaleLowerCase('tr').includes(q.toLocaleLowerCase('tr'))),
  )

  return (
    <div className="space-y-3">
      <PageHeader subtitle={`${notes.length} not`} title="Notlar" action={<Fab label="Not ekle" onClick={() => setOpen(true)} />} />

      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-faint" />
        <Input className="pl-11" placeholder="Notlarda ara" value={q} onChange={e => setQ(e.target.value)} />
      </div>
      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 [scrollbar-width:none]">
        <Chip active={!filter} onClick={() => setFilter(null)}>Tümü</Chip>
        {TAGS.map(t => <Chip key={t} active={filter === t} onClick={() => setFilter(t)}>{t}</Chip>)}
      </div>

      {shown.length === 0 && (
        <Card><Empty icon={NotebookPen} title={notes.length ? 'Sonuç yok' : 'Henüz not yok'} text={notes.length ? undefined : 'Aklına geleni, hissettiklerini, doktora soracaklarını yaz.'} /></Card>
      )}

      {shown.map(n => (
        <Card key={n.id}>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${tagTone[n.tag] ?? tagTone.Genel}`}>{n.tag}</span>
            <span className="text-[12px] text-faint flex-1">
              {new Date(n.createdAt).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
            <IconButton icon={Trash2} label="Sil" className="-my-2 -mr-2" onClick={() => confirm('Not silinsin mi?') && db.notes.delete(n.id)} />
          </div>
          <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed">{n.text}</p>
        </Card>
      ))}

      <Sheet open={open} onClose={() => setOpen(false)} title="Yeni not">
        <div className="space-y-3">
          <Textarea rows={5} placeholder="Ne düşünüyorsun?" value={text} onChange={e => setText(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            {TAGS.map(t => <Chip key={t} active={t === tag} onClick={() => setTag(t)}>{t}</Chip>)}
          </div>
          <Button className="w-full mt-2" onClick={add}>Kaydet</Button>
        </div>
      </Sheet>
    </div>
  )
}
