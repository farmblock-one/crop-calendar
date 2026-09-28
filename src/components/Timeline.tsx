import { diffDays, formatShort, today } from '../lib/date'
import type { StageInstance } from '../types'

/** Horizontal cycle bar: one segment per stage, proportional to its length, with a "today" marker. */
export function StageBar({ stages, showLabels = false }: { stages: StageInstance[]; showLabels?: boolean }) {
  if (!stages.length) return null
  const start = stages[0].start
  const total = diffDays(stages.at(-1)!.end, start) + 1
  const t = today()
  const todayPos = (diffDays(t, start) + 0.5) / total
  const cur = stages.find((s) => t >= s.start && t <= s.end)

  return (
    <div className={showLabels ? 'stage-bar labeled' : 'stage-bar'}>
      <div className="stage-track">
        {stages.map((s) => {
          const past = s.end < t
          const active = s === cur
          return (
            <div
              key={s.template.id}
              className={['seg-stage', past && 'past', active && 'active'].filter(Boolean).join(' ')}
              style={{ flexGrow: s.days, background: s.template.color }}
              title={`${s.template.name}: ${formatShort(s.start)} – ${formatShort(s.end)} (${s.days} ngày)`}
            >
              {showLabels && <span>{s.template.name}</span>}
            </div>
          )
        })}
        {todayPos >= 0 && todayPos <= 1 && (
          <div className="today-marker" style={{ left: `${todayPos * 100}%` }} title="Hôm nay">
            <span>Hôm nay</span>
          </div>
        )}
      </div>
      {showLabels && (
        <div className="stage-scale">
          <span>{formatShort(start)}</span>
          <span>{formatShort(stages.at(-1)!.end)}</span>
        </div>
      )}
    </div>
  )
}
