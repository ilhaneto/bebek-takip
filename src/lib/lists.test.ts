import { expect, test } from 'vitest'
import { linesToItems, progress, sortItems } from './lists'

test('satırlar maddelere çevrilir', () => {
  const items = linesToItems('- Süt\n\n• Bez \n*Termometre\nMama')
  expect(items.map(i => i.text)).toEqual(['Süt', 'Bez', 'Termometre', 'Mama'])
  expect(items.every(i => !i.done)).toBe(true)
  expect(new Set(items.map(i => i.id)).size).toBe(4)
})

test('tamamlananlar alta iner, sıra korunur; ilerleme', () => {
  const items = [
    { id: 'a', text: 'A', done: true },
    { id: 'b', text: 'B', done: false },
    { id: 'c', text: 'C', done: true },
    { id: 'd', text: 'D', done: false },
  ]
  expect(sortItems(items).map(i => i.id)).toEqual(['b', 'd', 'a', 'c'])
  expect(progress(items)).toEqual({ done: 2, total: 4 })
})
