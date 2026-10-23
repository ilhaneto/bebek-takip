import { HashRouter, NavLink, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Meds from './pages/Meds'
import Notes from './pages/Notes'
import Appointments from './pages/Appointments'
import Weight from './pages/Weight'

const tabs = [
  { to: '/', label: 'Ana', icon: '🏠' },
  { to: '/ilac', label: 'İlaç', icon: '💊' },
  { to: '/randevu', label: 'Randevu', icon: '🩺' },
  { to: '/not', label: 'Not', icon: '📝' },
  { to: '/kilo', label: 'Kilo', icon: '⚖️' },
]

export default function App() {
  return (
    <HashRouter>
      <main className="mx-auto max-w-md px-4 pt-4 pb-28">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ilac" element={<Meds />} />
          <Route path="/randevu" element={<Appointments />} />
          <Route path="/not" element={<Notes />} />
          <Route path="/kilo" element={<Weight />} />
        </Routes>
      </main>
      <nav
        className="fixed bottom-0 inset-x-0 border-t"
        style={{ background: 'var(--card)', borderColor: 'var(--line)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto max-w-md grid grid-cols-5">
          {tabs.map(t => (
            <NavLink
              key={t.to}
              to={t.to}
              className="flex flex-col items-center py-2 text-xs"
              style={({ isActive }) => ({ color: isActive ? 'var(--brand)' : 'var(--muted)', fontWeight: isActive ? 700 : 400 })}
            >
              <span className="text-xl">{t.icon}</span>
              {t.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </HashRouter>
  )
}
