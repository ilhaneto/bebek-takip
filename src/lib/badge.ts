import { useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { pregnancyWeek } from './dates'

/**
 * Ana ekran simgesinde doğuma kalan gün rozeti (Badging API).
 * iOS'ta yalnızca Ana Ekrana eklenmiş uygulamada (16.4+) ve bildirim izni verilmişse çalışır;
 * simge görseli değişmez, köşesinde sayı çıkar. Uygulama her açıldığında güncellenir.
 */
const KEY = 'badge'

type BadgeNavigator = Navigator & { setAppBadge?: (n?: number) => Promise<void>; clearAppBadge?: () => Promise<void> }
const nav = () => navigator as BadgeNavigator

export const badgeSupported = () => typeof nav().setAppBadge === 'function' && typeof Notification !== 'undefined'

export async function applyBadge(due: string | undefined, enabled: boolean) {
  if (!badgeSupported()) return
  try {
    const days = due ? pregnancyWeek(due).daysLeft : 0
    if (enabled && days > 0 && Notification.permission === 'granted') await nav().setAppBadge!(days)
    else await nav().clearAppBadge?.()
  } catch {
    // Rozet desteklenmiyorsa ya da izin geri alındıysa sessizce geç
  }
}

export const useBadgeSetting = () => useLiveQuery(async () => (await db.settings.get(KEY))?.value === '1', [])

/** Ayarlardan açılır; izin isteği kullanıcı dokunuşuyla tetiklenmeli */
export async function enableBadge(due: string | undefined): Promise<string | null> {
  if (!badgeSupported()) return 'Bu özellik yalnızca Ana Ekrana eklenmiş uygulamada çalışır (iOS 16.4 ve üstü). Safari sekmesinde açılamaz.'
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') return 'Simgede sayı gösterebilmek için iOS bildirim izni istiyor. Ayarlar > ilhanbaby > Bildirimler\'den izin verebilirsin.'
  await db.settings.put({ key: KEY, value: '1' })
  await applyBadge(due, true)
  return null
}

export async function disableBadge() {
  await db.settings.put({ key: KEY, value: '0' })
  await applyBadge(undefined, false)
}

/** Uygulama açıldığında ve öne geldiğinde rozeti günceller */
export function useBadgeSync(due: string | undefined) {
  const enabled = useBadgeSetting()
  useEffect(() => {
    if (enabled === undefined) return
    applyBadge(due, enabled)
    const onShow = () => document.visibilityState === 'visible' && applyBadge(due, enabled)
    document.addEventListener('visibilitychange', onShow)
    return () => document.removeEventListener('visibilitychange', onShow)
  }, [due, enabled])
}
