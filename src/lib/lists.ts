import type { ListItem } from '../db'

export const newItem = (text: string): ListItem => ({ id: crypto.randomUUID(), text, done: false })

/** Satır satır yazılmış metni maddelere çevirir (boş satırlar ve başlardaki -, *, • atılır) */
export const linesToItems = (text: string): ListItem[] =>
  text.split('\n').map(l => l.replace(/^\s*[-*•]\s*/, '').trim()).filter(Boolean).map(newItem)

/** Tamamlanmamışlar üstte, kendi sıralarını koruyarak */
export const sortItems = (items: ListItem[]) => [...items.filter(i => !i.done), ...items.filter(i => i.done)]

export const progress = (items: ListItem[]) => ({ done: items.filter(i => i.done).length, total: items.length })
