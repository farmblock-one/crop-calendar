import { TASK_TYPES } from '../data/crops'
import { WEEKDAY_LABELS, monthGrid, parseISO, today } from '../lib/date'
import { isOverdue, stageAt } from '../lib/schedule'
import type { StageInstance, TaskOccurrence } from '../types'

const MAX_CHIPS = 3

export function CalendarGrid<T extends TaskOccurrence>({ year, month, tasks, stages, selected, onSelect, label }: {
  year: number
  month: number
  tasks: T[]
  /** When showing a single plot, days are tinted with the stage colour. */
  stages?: StageInstance[]
  selected?: string
  onSelect: (day: string) => void
  label?: (t: T) => string
}) {
  const days = monthGrid(year, month)
  const byDay = new Map<string, T[]>()
  for (const t of tasks) {
    const list = byDay.get(t.date)
    if (list) list.push(t)
    else byDay.set(t.date, [t])
  }
  const t0 = today()
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`

  return (
    <div className="cal" role="grid">
      {WEEKDAY_LABELS.map((w) => (
        <div key={w} className="cal-head" role="columnheader">{w}</div>
      ))}
      {days.map((d) => {
        const list = byDay.get(d) ?? []
        const stage = stages && stageAt(stages, d)
        const isStageStart = stage && stage.start === d
        const cls = [
          'cal-day',
          !d.startsWith(monthPrefix) && 'other',
          d === t0 && 'today',
          d === selected && 'selected',
        ].filter(Boolean).join(' ')
        return (
          <button
            key={d}
            role="gridcell"
            className={cls}
            onClick={() => onSelect(d)}
            aria-label={`${d}: ${list.length} công việc`}
            style={stage ? ({ '--stage': stage.template.color } as React.CSSProperties) : undefined}
          >
            {stage && <span className="cal-stage-band" />}
            <span className="cal-num">{Number(d.slice(8))}</span>
            {isStageStart && <span className="cal-stage-name">{stage.template.name}</span>}
            <span className="cal-chips">
              {list.slice(0, MAX_CHIPS).map((t) => (
                <span
                  key={t.plotId + t.key}
                  className={['cal-chip', t.done && 'done', t.skipped && 'skipped', isOverdue(t) && 'overdue'].filter(Boolean).join(' ')}
                  style={{ '--chip': TASK_TYPES[t.type].color } as React.CSSProperties}
                >
                  <span aria-hidden>{TASK_TYPES[t.type].icon}</span>
                  <span className="cal-chip-text">{label ? label(t) : t.title}</span>
                </span>
              ))}
              {list.length > MAX_CHIPS && <span className="cal-more">+{list.length - MAX_CHIPS} việc</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function MonthNav({ year, month, onChange }: { year: number; month: number; onChange: (y: number, m: number) => void }) {
  const go = (delta: number) => {
    const d = new Date(Date.UTC(year, month + delta, 1))
    onChange(d.getUTCFullYear(), d.getUTCMonth())
  }
  const now = parseISO(today())
  return (
    <div className="month-nav">
      <button className="icon-btn" onClick={() => go(-1)} aria-label="Tháng trước">‹</button>
      <strong>Tháng {month + 1}/{year}</strong>
      <button className="icon-btn" onClick={() => go(1)} aria-label="Tháng sau">›</button>
      <button className="btn small" onClick={() => onChange(now.getUTCFullYear(), now.getUTCMonth())}>Hôm nay</button>
    </div>
  )
}
