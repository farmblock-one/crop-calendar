import { useEffect, type ReactNode } from 'react'
import { TASK_TYPES } from '../data/crops'
import type { TaskType } from '../types'

export function Modal({ title, onClose, children, footer }: {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Đóng">✕</button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>
  )
}

export function TypeChip({ type, compact }: { type: TaskType; compact?: boolean }) {
  const t = TASK_TYPES[type]
  return (
    <span className="type-chip" style={{ '--chip': t.color } as React.CSSProperties} title={t.label}>
      <span aria-hidden>{t.icon}</span>
      {!compact && t.label}
    </span>
  )
}

export function TypeFilter({ value, onChange }: { value: TaskType | 'all'; onChange: (v: TaskType | 'all') => void }) {
  return (
    <div className="seg" role="group" aria-label="Lọc theo loại công việc">
      <button className={value === 'all' ? 'on' : ''} onClick={() => onChange('all')}>Tất cả</button>
      {(Object.keys(TASK_TYPES) as TaskType[]).map((k) => (
        <button key={k} className={value === k ? 'on' : ''} onClick={() => onChange(k)} title={TASK_TYPES[k].label}>
          <span aria-hidden>{TASK_TYPES[k].icon}</span> <span className="seg-label">{TASK_TYPES[k].label}</span>
        </button>
      ))}
    </div>
  )
}

export function Empty({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-icon" aria-hidden>{icon}</div>
      <div>{children}</div>
    </div>
  )
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}
