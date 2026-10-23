import { useState } from 'react'
import { HashRouter, Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import { BookOpen, CalendarHeart, HeartPulse, House, NotebookPen, Pill, Plus, Scale, type LucideIcon } from 'lucide-react'
import Home from './pages/Home'
import Meds from './pages/Meds'
import Notes from './pages/Notes'
import Appointments from './pages/Appointments'
import Measures from './pages/Measures'
import Settings from './pages/Settings'
import Section from './pages/Section'
import { IconBadge, Sheet } from './components/ui'

const tabs: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/', label: 'Bugün', icon: House },
  { to: '/saglik', label: 'Sağlık', icon: HeartPulse },
  { to: '/takvim', label: 'Takvim', icon: CalendarHeart },
  { to: '/defter', label: 'Defter', icon: BookOpen },
]

const quickAdd: { label: string; hint: string; icon: LucideIcon; tone: 'rose' | 'violet' | 'mint' | 'amber'; to: string }[] = [
  { label: 'Ölçüm', hint: 'Kilo, tansiyon, şeker', icon: Scale, tone: 'mint', to: '/saglik/olcumler?yeni=1' },
  { label: 'Not', hint: 'Soru, his, hatırlatma', icon: NotebookPen, tone: 'amber', to: '/defter/notlar?yeni=1' },
  { label: 'Randevu', hint: 'Kontrol, test, ultrason', icon: CalendarHeart, tone: 'violet', to: '/takvim/randevular?yeni=1' },
  { label: 'İlaç', hint: 'Yeni ilaç veya vitamin', icon: Pill, tone: 'rose', to: '/saglik/ilaclar?yeni=1' },
]

function TabLink({ to, label, icon: Icon }: { to: string; label: string; icon: LucideIcon }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 rounded-[20px] py-2 text-[11px] font-medium transition ${isActive ? 'bg-surface-2 text-ink' : 'text-faint'}`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={21} strokeWidth={isActive ? 2.4 : 1.9} className={isActive ? 'text-rose' : ''} />
          {label}
        </>
      )}
    </NavLink>
  )
}

function Shell() {
  const nav = useNavigate()
  const [adding, setAdding] = useState(false)

  return (
    <>
      <main className="mx-auto max-w-md px-4 pt-3 pb-32">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/saglik/:seg?"
            element={<Section base="saglik" title="Sağlık" segments={[
              { value: 'ilaclar', label: 'İlaçlar', element: <Meds /> },
              { value: 'olcumler', label: 'Ölçümler', element: <Measures /> },
            ]} />}
          />
          <Route
            path="/takvim/:seg?"
            element={<Section base="takvim" title="Takvim" segments={[
              { value: 'randevular', label: 'Randevular', element: <Appointments /> },
            ]} />}
          />
          <Route
            path="/defter/:seg?"
            element={<Section base="defter" title="Defter" segments={[
              { value: 'notlar', label: 'Notlar', element: <Notes /> },
            ]} />}
          />
          <Route path="/ayarlar" element={<Settings />} />
          {/* Eski adresler */}
          <Route path="/ilac" element={<Navigate to="/saglik/ilaclar" replace />} />
          <Route path="/kilo" element={<Navigate to="/saglik/olcumler" replace />} />
          <Route path="/randevu" element={<Navigate to="/takvim/randevular" replace />} />
          <Route path="/not" element={<Navigate to="/defter/notlar" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 px-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 10px)' }}>
        <div className="mx-auto max-w-md grid grid-cols-5 items-center rounded-[26px] border border-line/80 bg-surface/80 backdrop-blur-xl p-1.5 shadow-2xl shadow-black/50">
          <TabLink {...tabs[0]} />
          <TabLink {...tabs[1]} />
          <div className="grid place-items-center">
            <button
              onClick={() => setAdding(true)}
              aria-label="Hızlı ekle"
              className="grid size-12 place-items-center rounded-full bg-gradient-to-br from-rose to-violet text-white shadow-lg shadow-rose/30 active:scale-90 transition"
            >
              <Plus size={24} strokeWidth={2.6} />
            </button>
          </div>
          <TabLink {...tabs[2]} />
          <TabLink {...tabs[3]} />
        </div>
      </nav>

      <Sheet open={adding} onClose={() => setAdding(false)} title="Ne eklemek istersin?">
        <div className="grid grid-cols-2 gap-2">
          {quickAdd.map(q => (
            <button
              key={q.label}
              onClick={() => { setAdding(false); nav(q.to) }}
              className="flex flex-col items-start gap-3 rounded-3xl border border-line bg-surface-2 p-4 text-left active:scale-[0.98] transition"
            >
              <IconBadge icon={q.icon} tone={q.tone} />
              <div>
                <p className="font-semibold">{q.label}</p>
                <p className="text-[12px] text-muted">{q.hint}</p>
              </div>
            </button>
          ))}
        </div>
      </Sheet>
    </>
  )
}

export default function App() {
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  )
}
