import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Check, ListChecks, NotebookPen, Plus, Search, Trash2, X } from 'lucide-react'
import { db, type ListItem, type Note } from '../db'
import { linesToItems, progress, sortItems } from '../lib/lists'
import { Button, Card, Chip, Empty, Fab, IconButton, Input, Label, PageHeader, Sheet, Textarea, useOpenFromQuickAdd } from '../components/ui'

const TAGS = ['Genel', 'Soru', 'Semptom', 'Hatırlatma', 'Hazırlık']
const tagTone: Record<string, string> = {
  Genel: 'text-violet bg-violet/15',
  Soru: 'text-amber bg-amber/15',
  Semptom: 'text-rose bg-rose/15',
  Hatırlatma: 'text-mint bg-mint/15',
  Hazırlık: 'text-mint bg-mint/15',
}

const isList = (n: Note) => n.kind === 'list'
const fmtStamp = (t: number) => new Date(t).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const touch = (id: number, patch: Partial<Note>) => db.notes.update(id, { ...patch, updatedAt: Date.now() })

function Checkbox({ done, onToggle }: { done: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onToggle() }}
      aria-label={done ? 'İşareti kaldır' : 'Tamamlandı işaretle'}
      className={`grid size-6 shrink-0 place-items-center rounded-lg border-2 transition active:scale-90 ${done ? 'border-mint bg-mint text-bg' : 'border-line'}`}
    >
      {done && <Check size={14} strokeWidth={3.5} />}
    </button>
  )
}

const toggleItem = (n: Note, itemId: string) =>
  touch(n.id, { items: (n.items ?? []).map(i => (i.id === itemId ? { ...i, done: !i.done } : i)) })

function TagRow({ tag, onPick }: { tag: string; onPick: (t: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {TAGS.map(t => <Chip key={t} active={t === tag} onClick={() => onPick(t)}>{t}</Chip>)}
    </div>
  )
}

function NoteCard({ n, onOpen }: { n: Note; onOpen: () => void }) {
  const items = n.items ?? []
  const p = progress(items)
  const shown = sortItems(items).slice(0, 5)
  return (
    <Card onClick={onOpen}>
      <div className="flex items-center gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${tagTone[n.tag] ?? tagTone.Genel}`}>{n.tag}</span>
        <span className="flex-1 text-[12px] text-faint">{fmtStamp(n.updatedAt ?? n.createdAt)}</span>
        {isList(n) && p.total > 0 && (
          <span className={`text-[12px] font-semibold ${p.done === p.total ? 'text-mint' : 'text-muted'}`}>{p.done}/{p.total}</span>
        )}
      </div>
      {isList(n) ? (
        <>
          <p className="mt-2 flex items-center gap-1.5 font-semibold"><ListChecks size={16} className="text-mint" /> {n.text}</p>
          {p.total > 0 && (
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-mint transition-all" style={{ width: `${(p.done / p.total) * 100}%` }} />
            </div>
          )}
          <div className="mt-2 space-y-1.5">
            {shown.map(i => (
              <div key={i.id} className="flex items-center gap-2.5">
                <Checkbox done={i.done} onToggle={() => toggleItem(n, i.id)} />
                <span className={`truncate text-[15px] ${i.done ? 'text-faint line-through' : ''}`}>{i.text}</span>
              </div>
            ))}
            {items.length > shown.length && <p className="pl-8 text-[12px] text-muted">+{items.length - shown.length} madde daha</p>}
            {items.length === 0 && <p className="text-[13px] text-muted">Henüz madde yok, eklemek için dokun.</p>}
          </div>
        </>
      ) : (
        <p className="mt-2 line-clamp-6 whitespace-pre-wrap text-[15px] leading-relaxed">{n.text}</p>
      )}
    </Card>
  )
}

/** Mevcut notu/listeyi düzenleme; liste değişiklikleri anında, metin kapanırken kaydedilir */
function Editor({ note, onClose }: { note: Note; onClose: () => void }) {
  const [text, setText] = useState(note.text)
  const [newText, setNewText] = useState('')
  useEffect(() => setText(note.text), [note.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const items = note.items ?? []
  const p = progress(items)

  const saveText = () => {
    const t = text.trim()
    if (t && t !== note.text) touch(note.id, { text: t })
  }
  const setItems = (next: ListItem[]) => touch(note.id, { items: next })
  const addItem = () => {
    const t = newText.trim()
    if (!t) return
    setItems([...items, ...linesToItems(t)])
    setNewText('')
  }
  const remove = async () => {
    if (!confirm(isList(note) ? 'Liste silinsin mi?' : 'Not silinsin mi?')) return
    await db.notes.delete(note.id)
    onClose()
  }

  return (
    <div className="space-y-4">
      {isList(note) ? (
        <>
          <div><Label>Başlık</Label><Input value={text} onChange={e => setText(e.target.value)} onBlur={saveText} /></div>
          {p.total > 0 && <p className="px-1 text-[13px] text-muted">{p.done} / {p.total} tamamlandı</p>}
          <Card className="p-1.5">
            {sortItems(items).map((i, k) => (
              <div key={i.id} className={`flex items-center gap-2.5 px-2 py-1.5 ${k ? 'border-t border-line/70' : ''}`}>
                <Checkbox done={i.done} onToggle={() => setItems(items.map(x => (x.id === i.id ? { ...x, done: !x.done } : x)))} />
                <input
                  defaultValue={i.text}
                  onBlur={e => {
                    const v = e.target.value.trim()
                    if (v && v !== i.text) setItems(items.map(x => (x.id === i.id ? { ...x, text: v } : x)))
                  }}
                  className={`min-w-0 flex-1 bg-transparent py-1.5 text-[15px] outline-none ${i.done ? 'text-faint line-through' : ''}`}
                />
                <IconButton icon={X} label="Maddeyi sil" className="size-8" onClick={() => setItems(items.filter(x => x.id !== i.id))} />
              </div>
            ))}
            <div className={`flex items-center gap-2 px-2 py-1.5 ${items.length ? 'border-t border-line/70' : ''}`}>
              <Plus size={18} className="shrink-0 text-faint" />
              <input
                value={newText}
                placeholder="Madde ekle"
                onChange={e => setNewText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addItem()}
                onBlur={addItem}
                className="min-w-0 flex-1 bg-transparent py-1.5 text-[15px] outline-none placeholder:text-faint"
              />
            </div>
          </Card>
        </>
      ) : (
        <Textarea rows={8} value={text} onChange={e => setText(e.target.value)} onBlur={saveText} />
      )}

      <TagRow tag={note.tag} onPick={t => touch(note.id, { tag: t })} />

      <p className="px-1 text-[12px] text-faint">
        Oluşturuldu {fmtStamp(note.createdAt)}{note.updatedAt && ` · Düzenlendi ${fmtStamp(note.updatedAt)}`}
      </p>
      <div className="flex gap-2">
        <Button className="flex-1" onClick={() => { saveText(); onClose() }}>Tamam</Button>
        <Button variant="soft" className="text-rose" aria-label="Sil" onClick={remove}><Trash2 size={18} /></Button>
      </div>
    </div>
  )
}

function Creator({ onDone }: { onDone: () => void }) {
  const [kind, setKind] = useState<'text' | 'list'>('text')
  const [text, setText] = useState('')
  const [lines, setLines] = useState('')
  const [tag, setTag] = useState(TAGS[0])

  async function save() {
    if (!text.trim()) return
    await db.notes.add({
      text: text.trim(), tag, createdAt: Date.now(),
      ...(kind === 'list' && { kind: 'list', items: linesToItems(lines) }),
    } as never)
    onDone()
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-1 rounded-2xl border border-line bg-surface-2 p-1">
        {([['text', 'Not', NotebookPen], ['list', 'Liste', ListChecks]] as const).map(([v, l, Icon]) => (
          <button
            key={v}
            onClick={() => setKind(v)}
            className={`flex h-10 items-center justify-center gap-1.5 rounded-xl text-[14px] font-semibold transition ${kind === v ? 'bg-surface text-ink shadow' : 'text-muted'}`}
          >
            <Icon size={16} /> {l}
          </button>
        ))}
      </div>

      {kind === 'text' ? (
        <Textarea rows={6} placeholder="Ne düşünüyorsun?" value={text} onChange={e => setText(e.target.value)} />
      ) : (
        <>
          <div><Label>Başlık</Label><Input placeholder="Ör. Bu hafta alınacaklar" value={text} onChange={e => setText(e.target.value)} /></div>
          <div><Label>Maddeler (her satır bir madde)</Label><Textarea rows={6} placeholder={'Süt\nBez\nTermometre'} value={lines} onChange={e => setLines(e.target.value)} /></div>
        </>
      )}

      <TagRow tag={tag} onPick={setTag} />
      <Button className="w-full" onClick={save}>Kaydet</Button>
    </div>
  )
}

export default function Notes() {
  const notes = useLiveQuery(() => db.notes.orderBy('createdAt').reverse().toArray(), [])
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<string | null>(null)
  useOpenFromQuickAdd(() => setCreating(true))

  const all = notes ?? []
  const editing = all.find(n => n.id === editingId) ?? null
  const needle = q.toLocaleLowerCase('tr')
  const shown = all.filter(n =>
    (!filter || (filter === 'Listeler' ? isList(n) : n.tag === filter))
    && (!q || [n.text, ...(n.items ?? []).map(i => i.text)].some(s => s.toLocaleLowerCase('tr').includes(needle))),
  )

  return (
    <div className="space-y-3">
      <PageHeader compact subtitle={`${all.length} kayıt`} title="Notlar ve listeler" action={<Fab label="Not ekle" onClick={() => setCreating(true)} />} />

      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-faint" />
        <Input className="pl-11" placeholder="Notlarda ve listelerde ara" value={q} onChange={e => setQ(e.target.value)} />
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        <Chip active={!filter} onClick={() => setFilter(null)}>Tümü</Chip>
        <Chip active={filter === 'Listeler'} onClick={() => setFilter('Listeler')}>Listeler</Chip>
        {TAGS.map(t => <Chip key={t} active={filter === t} onClick={() => setFilter(t)}>{t}</Chip>)}
      </div>

      {notes !== undefined && shown.length === 0 && (
        <Card>
          <Empty
            icon={NotebookPen}
            title={all.length ? 'Sonuç yok' : 'Henüz not yok'}
            text={all.length ? undefined : 'Aklına geleni yaz ya da hastane çantası gibi bir liste oluştur.'}
          />
        </Card>
      )}

      {shown.map(n => <NoteCard key={n.id} n={n} onOpen={() => setEditingId(n.id)} />)}

      <Sheet open={creating} onClose={() => setCreating(false)} title="Yeni">
        {creating && <Creator onDone={() => setCreating(false)} />}
      </Sheet>
      <Sheet open={!!editing} onClose={() => setEditingId(null)} title={editing && isList(editing) ? 'Listeyi düzenle' : 'Notu düzenle'}>
        {editing && <Editor key={editing.id} note={editing} onClose={() => setEditingId(null)} />}
      </Sheet>
    </div>
  )
}
