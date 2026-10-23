import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { shiftDay } from './symptoms'

/**
 * Haftaya göre ortalama bebek boyu ve kilosu ile bir karşılaştırma.
 * Boy 20. haftaya kadar baş–popo, sonrasında baş–topuk ölçüsüdür. Değerler yaklaşıktır.
 * emoji yoksa (çok erken haftalar) kart küçük bir nokta çizer.
 */
export interface BabyWeek { week: number; name: string; emoji?: string; cm: number; g: number; phrase?: string }

export const BABY_WEEKS: BabyWeek[] = [
  { week: 4, name: 'haşhaş tohumu', cm: 0.1, g: 0 },
  { week: 5, name: 'susam tanesi', cm: 0.2, g: 0 },
  { week: 6, name: 'bezelye tanesi', emoji: '🫛', cm: 0.6, g: 0 },
  { week: 7, name: 'yaban mersini', emoji: '🫐', cm: 1.3, g: 1 },
  { week: 8, name: 'fasulye', emoji: '🫘', cm: 1.6, g: 1 },
  { week: 9, name: 'kiraz', emoji: '🍒', cm: 2.3, g: 2 },
  { week: 10, name: 'çilek', emoji: '🍓', cm: 3.1, g: 4 },
  { week: 11, name: 'kestane', emoji: '🌰', cm: 4.1, g: 7 },
  { week: 12, name: 'kivi', emoji: '🥝', cm: 5.4, g: 14 },
  { week: 13, name: 'limon', emoji: '🍋', cm: 7.4, g: 23 },
  { week: 14, name: 'şeftali', emoji: '🍑', cm: 8.7, g: 43 },
  { week: 15, name: 'elma', emoji: '🍎', cm: 10.1, g: 70 },
  { week: 16, name: 'avokado', emoji: '🥑', cm: 11.6, g: 100 },
  { week: 17, name: 'armut', emoji: '🍐', cm: 13, g: 140 },
  { week: 18, name: 'dolmalık biber', emoji: '🫑', cm: 14.2, g: 190 },
  { week: 19, name: 'mango', emoji: '🥭', cm: 15.3, g: 240 },
  { week: 20, name: 'muz', emoji: '🍌', cm: 25.6, g: 300 },
  { week: 21, name: 'havuç', emoji: '🥕', cm: 26.7, g: 360 },
  { week: 22, name: 'hindistan cevizi', emoji: '🥥', cm: 27.8, g: 430 },
  { week: 23, name: 'tatlı patates', emoji: '🍠', cm: 28.9, g: 500 },
  { week: 24, name: 'mısır koçanı', emoji: '🌽', cm: 30, g: 600 },
  { week: 25, name: 'brokoli', emoji: '🥦', cm: 34.6, g: 660 },
  { week: 26, name: 'marul', emoji: '🥬', cm: 35.6, g: 760 },
  { week: 27, name: 'salatalık', emoji: '🥒', cm: 36.6, g: 875 },
  { week: 28, name: 'patlıcan', emoji: '🍆', cm: 37.6, g: 1005 },
  { week: 29, name: 'ananas', emoji: '🍍', cm: 38.6, g: 1150 },
  { week: 30, name: 'baget ekmek', emoji: '🥖', cm: 39.9, g: 1320 },
  { week: 31, name: 'oyuncak ayı', emoji: '🧸', cm: 41.1, g: 1500 },
  { week: 32, name: 'kavun', emoji: '🍈', cm: 42.4, g: 1700 },
  { week: 33, name: 'basketbol topu', emoji: '🏀', cm: 43.7, g: 1920 },
  { week: 34, name: 'yavru kedi', emoji: '🐱', cm: 45, g: 2150 },
  { week: 35, name: 'tavşan', emoji: '🐰', cm: 46.2, g: 2380 },
  { week: 36, name: 'yavru köpek', emoji: '🐶', cm: 47.4, g: 2620 },
  { week: 37, name: 'bal kabağı', emoji: '🎃', cm: 48.6, g: 2860 },
  { week: 38, name: 'futbol topu', emoji: '⚽', cm: 49.8, g: 3080 },
  { week: 39, name: 'karpuz', emoji: '🍉', cm: 50.7, g: 3290 },
  { week: 40, name: 'yeni doğan', emoji: '👶', cm: 51.2, g: 3460, phrase: 'Bebeğin doğmaya hazır' },
]

export const FIRST_WEEK = BABY_WEEKS[0].week
export const LAST_WEEK = BABY_WEEKS[BABY_WEEKS.length - 1].week

/** Haftanın karşılaştırması (sınırların dışı en yakın haftaya sabitlenir) */
export function babyWeek(week: number): BabyWeek {
  return BABY_WEEKS[Math.min(Math.max(week, FIRST_WEEK), LAST_WEEK) - FIRST_WEEK]
}

/** Boy ve kilo, iki hafta arasında güne göre doğrusal; her gün biraz değişir */
export function babySize(week: number, day: number): { cm: number; g: number } {
  const a = babyWeek(week), b = babyWeek(week + 1)
  if (week < FIRST_WEEK || a === b) return { cm: a.cm, g: a.g }
  const t = day / 7
  return { cm: a.cm + (b.cm - a.cm) * t, g: a.g + (b.g - a.g) * t }
}

export function sizeLabel({ cm, g }: { cm: number; g: number }): string {
  const len = cm < 1 ? `${(cm * 10).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} mm` : `${cm.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} cm`
  const weight = g < 1 ? '' : g < 1000 ? `${Math.round(g)} g` : `${(g / 1000).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} kg`
  return weight ? `${len} · ${weight}` : len
}

export const comparePhrase = (b: BabyWeek) => b.phrase ?? `Bebeğin bir ${b.name} kadar`

/** Son adet tarihi ile tahmini doğum tarihi arasında 280 gün vardır */
export const dueFromLmp = (lmp: string) => shiftDay(lmp, 280)
export const lmpFromDue = (due: string) => shiftDay(due, -280)

/** Gebelik tarihleri; ikisi birlikte saklanır, eski kayıtlarda yalnızca doğum tarihi olabilir. undefined = yükleniyor */
export function usePregnancyDates(): { lmp: string; due: string } | null | undefined {
  return useLiveQuery(async () => {
    const [lmp, due] = await Promise.all([db.settings.get('lmp'), db.settings.get('dueDate')])
    if (due?.value) return { lmp: lmp?.value || lmpFromDue(due.value), due: due.value }
    if (lmp?.value) return { lmp: lmp.value, due: dueFromLmp(lmp.value) }
    return null
  }, [])
}

export async function savePregnancyDates(input: { lmp: string } | { due: string }) {
  const lmp = 'lmp' in input ? input.lmp : lmpFromDue(input.due)
  const due = 'due' in input ? input.due : dueFromLmp(input.lmp)
  await db.settings.bulkPut([{ key: 'lmp', value: lmp }, { key: 'dueDate', value: due }])
}
