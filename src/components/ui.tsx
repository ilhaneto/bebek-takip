import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ')

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="flex items-end justify-between pt-2 pb-5">
      <div>
        {subtitle && <p className="text-[13px] font-medium text-muted">{subtitle}</p>}
        <h1 className="text-[30px] font-bold tracking-tight leading-tight">{title}</h1>
      </div>
      {action}
    </header>
  )
}

export function Card({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cx(
        'rounded-3xl bg-surface/80 border border-line/70 p-4 backdrop-blur-sm',
        onClick && 'active:scale-[0.99] transition-transform cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-1 pt-3 pb-2">
      <h2 className="text-[13px] font-semibold uppercase tracking-wider text-faint">{children}</h2>
      {right}
    </div>
  )
}

type Variant = 'primary' | 'soft' | 'ghost'
export function Button({ variant = 'primary', className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...p}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-2xl px-4 min-h-12 text-[15px] font-semibold transition active:scale-[0.97] disabled:opacity-40',
        variant === 'primary' && 'bg-gradient-to-br from-rose to-violet text-white shadow-lg shadow-rose/20',
        variant === 'soft' && 'bg-surface-2 text-ink border border-line',
        variant === 'ghost' && 'text-muted',
        className,
      )}
    />
  )
}

export function IconButton({ icon: Icon, label, className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { icon: LucideIcon; label: string }) {
  return (
    <button
      {...p}
      aria-label={label}
      className={cx('grid place-items-center size-10 rounded-full text-muted hover:text-ink active:bg-surface-2 transition', className)}
    >
      <Icon size={18} />
    </button>
  )
}

const field = 'w-full rounded-2xl bg-surface-2 border border-line px-4 py-3 text-[16px] text-ink placeholder:text-faint outline-none focus:border-rose/60 focus:ring-4 focus:ring-rose/10 transition'

export function Input({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...p} className={cx(field, className)} />
}

export function Textarea({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...p} className={cx(field, 'resize-none', className)} />
}

export function Label({ children }: { children: ReactNode }) {
  return <span className="block px-1 pb-1.5 text-[13px] font-medium text-muted">{children}</span>
}

export function Chip({ active, children, onClick }: { active?: boolean; children: ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'rounded-full px-3.5 h-9 text-[14px] font-medium border transition active:scale-95',
        active ? 'bg-rose/15 border-rose/50 text-rose' : 'bg-surface-2 border-line text-muted',
      )}
    >
      {children}
    </button>
  )
}

export function IconBadge({ icon: Icon, tone = 'rose' }: { icon: LucideIcon; tone?: 'rose' | 'violet' | 'mint' | 'amber' }) {
  const tones = {
    rose: 'bg-rose/15 text-rose',
    violet: 'bg-violet/15 text-violet',
    mint: 'bg-mint/15 text-mint',
    amber: 'bg-amber/15 text-amber',
  }
  return (
    <span className={cx('grid place-items-center size-11 shrink-0 rounded-2xl', tones[tone])}>
      <Icon size={20} strokeWidth={2.2} />
    </span>
  )
}

export function Empty({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text?: string }) {
  return (
    <div className="flex flex-col items-center text-center py-10 px-6">
      <span className="grid place-items-center size-14 rounded-full bg-surface-2 text-faint mb-3">
        <Icon size={24} />
      </span>
      <p className="font-semibold">{title}</p>
      {text && <p className="text-sm text-muted mt-1">{text}</p>}
    </div>
  )
}

/** Alttan açılan form paneli */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  return (
    <div className={cx('fixed inset-0 z-50 transition', open ? 'visible' : 'invisible')}>
      <div onClick={onClose} className={cx('absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity', open ? 'opacity-100' : 'opacity-0')} />
      <div
        className={cx(
          'absolute inset-x-0 bottom-0 mx-auto max-w-md rounded-t-[28px] bg-surface border-t border-line p-5 transition-transform duration-300 max-h-[90vh] overflow-y-auto',
          open ? 'translate-y-0' : 'translate-y-full',
        )}
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)' }}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line" />
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        {children}
      </div>
    </div>
  )
}

export function Fab({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="grid place-items-center size-11 rounded-full bg-gradient-to-br from-rose to-violet text-white shadow-lg shadow-rose/25 active:scale-90 transition"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
    </button>
  )
}
