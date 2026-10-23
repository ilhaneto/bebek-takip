import { HashRouter, NavLink, Route, Routes } from 'react-router-dom'
import { CalendarHeart, House, NotebookPen, Pill, Scale, type LucideIcon } from 'lucide-react'
import Home from './pages/Home'
import Meds from './pages/Meds'
import Notes from './pages/Notes'
import Appointments from './pages/Appointments'
import Weight from './pages/Weight'

const tabs: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/', label: 'Bugün', icon: House },
  { to: '/ilac', label: 'İlaç', icon: Pill },
  { to: '/randevu', label: 'Randevu', icon: CalendarHeart },
  { to: '/not', label: 'Notlar', icon: NotebookPen },
  { to: '/kilo', label: 'Kilo', icon: Scale },
]

export default function App() {
  return (
    <HashRouter>
      <main className="mx-auto max-w-md px-4 pt-3 pb-32">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ilac" element={<Meds />} />
          <Route path="/randevu" element={<Appointments />} />
          <Route path="/not" element={<Notes />} />
          <Route path="/kilo" element={<Weight />} />
        </Routes>
      </main>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 px-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 10px)' }}
      >
        <div className="mx-auto max-w-md grid grid-cols-5 rounded-[26px] border border-line/80 bg-surface/80 backdrop-blur-xl p-1.5 shadow-2xl shadow-black/50">
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 rounded-[20px] py-2 text-[11px] font-medium transition ${
                  isActive ? 'bg-surface-2 text-ink' : 'text-faint'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={21} strokeWidth={isActive ? 2.4 : 1.9} className={isActive ? 'text-rose' : ''} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </HashRouter>
  )
}
