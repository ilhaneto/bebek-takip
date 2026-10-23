import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'

const TAGS = ['Genel', 'Soru', 'Semptom', 'Hatırlatma']

export default function Notes() {
  const notes = useLiveQuery(() => db.notes.orderBy('createdAt').reverse().toArray(), []) ?? []
  const [text, setText] = useState('')
  const [tag, setTag] = useState(TAGS[0])
  const [q, setQ] = useState('')

  async function add() {
    if (!text.trim()) return
    await db.notes.add({ text: text.trim(), tag, createdAt: Date.now() } as never)
    setText('')
  }

  const shown = notes.filter(n => !q || n.text.toLowerCase().includes(q.toLowerCase()) || n.tag.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Notlar</h1>
      <div className="card space-y-2">
        <textarea className="input" rows={3} placeholder="Not yaz…" value={text} onChange={e => setText(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          {TAGS.map(t => (
            <button key={t} className={t === tag ? 'btn' : 'btn-ghost'} onClick={() => setTag(t)}>{t}</button>
          ))}
        </div>
        <button className="btn w-full" onClick={add}>Kaydet</button>
      </div>
      <input className="input" placeholder="Ara…" value={q} onChange={e => setQ(e.target.value)} />
      {shown.map(n => (
        <div key={n.id} className="card">
          <div className="flex justify-between text-xs muted">
            <span>{n.tag} · {new Date(n.createdAt).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            <button onClick={() => confirm('Not silinsin mi?') && db.notes.delete(n.id)}>Sil</button>
          </div>
          <p className="mt-1 whitespace-pre-wrap">{n.text}</p>
        </div>
      ))}
    </div>
  )
}
