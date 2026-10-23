import type { ListItem } from '../db'

export const newItem = (text: string): ListItem => ({ id: crypto.randomUUID(), text, done: false })

/** Satır satır yazılmış metni maddelere çevirir (boş satırlar ve başlardaki -, *, • atılır) */
export const linesToItems = (text: string): ListItem[] =>
  text.split('\n').map(l => l.replace(/^\s*[-*•]\s*/, '').trim()).filter(Boolean).map(newItem)

/** Tamamlanmamışlar üstte, kendi sıralarını koruyarak */
export const sortItems = (items: ListItem[]) => [...items.filter(i => !i.done), ...items.filter(i => i.done)]

export const progress = (items: ListItem[]) => ({ done: items.filter(i => i.done).length, total: items.length })

export const TEMPLATES: { title: string; emoji: string; items: string[] }[] = [
  {
    title: 'Hastane çantası – Anne', emoji: '👜',
    items: [
      'Kimlik ve sağlık belgeleri', 'Gebelik takip dosyası ve tahliller', 'Önden açılır gecelik (2 adet)', 'Sabahlık',
      'Terlik', 'Emzirme sütyeni', 'Göğüs pedi', 'Lohusa pedi', 'Tek kullanımlık külot', 'Diş fırçası ve macun',
      'Şampuan ve duş jeli', 'Tarak ve toka', 'Dudak nemlendirici', 'Telefon şarj aleti (uzun kablo)',
      'Taburcu kıyafeti', 'Pipetli su şişesi', 'Atıştırmalık',
    ],
  },
  {
    title: 'Hastane çantası – Bebek', emoji: '🍼',
    items: [
      'Zıbın (3–4 adet)', 'Body veya tulum (3–4 adet)', 'Hastane çıkış kıyafeti', 'Battaniye / kundak', 'Bere',
      'Çorap', 'Tırnak eldiveni', 'Yenidoğan bezi', 'Hassas ıslak mendil', 'Pişik kremi', 'Ağız mendili / tülbent',
      'Ana kucağı (oto koltuğu)',
    ],
  },
  {
    title: 'Hastane çantası – Eş', emoji: '🎒',
    items: [
      'Kimlik', 'Şarj aleti ve powerbank', 'Rahat kıyafet ve yedek tişört', 'Diş fırçası', 'Atıştırmalık ve su',
      'Otopark için bozuk para / kart', 'Önemli telefon numaraları',
    ],
  },
  {
    title: 'Bebek için alınacaklar', emoji: '🛒',
    items: [
      'Beşik ve yatak', 'Alt açma minderi', 'Bebek arabası', 'Ana kucağı (oto koltuğu)', 'Biberon ve emzik',
      'Bebek küveti', 'Bebek termometresi', 'Burun aspiratörü', 'Tırnak makası', 'Bebek çamaşır deterjanı',
      'Uyku tulumu', 'Gece lambası',
    ],
  },
  { title: 'İsim listesi', emoji: '✨', items: [] },
]
