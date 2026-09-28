import { useState } from 'react'
import { CalendarGrid, MonthNav } from '../components/CalendarGrid'
import { TaskRow } from '../components/TaskRow'
import { TypeFilter } from '../components/ui'
import { formatDate, parseISO, today } from '../lib/date'
import { useAllTasks, useSchedules } from '../lib/hooks'
import type { TaskType } from '../types'

export function CalendarPage() {
  const schedules = useSchedules()
  const all = useAllTasks()
  const t0 = parseISO(today())
  const [ym, setYm] = useState({ y: t0.getUTCFullYear(), m: t0.getUTCMonth() })
  const [selected, setSelected] = useState(today())
  const [plotId, setPlotId] = useState('all')
  const [type, setType] = useState<TaskType | 'all'>('all')

  const tasks = all.filter((t) => (plotId === 'all' || t.plotId === plotId) && (type === 'all' || t.type === type))
  const single = schedules.find((s) => s.plot.id === plotId)
  const dayTasks = tasks.filter((t) => t.date === selected)

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Lịch công việc</h1>
          <p className="muted">Toàn bộ công việc của các khu trồng theo tháng.</p>
        </div>
      </div>
      <div className="toolbar">
        <select value={plotId} onChange={(e) => setPlotId(e.target.value)} aria-label="Chọn khu trồng">
          <option value="all">Tất cả khu trồng</option>
          {schedules.map((s) => (
            <option key={s.plot.id} value={s.plot.id}>{s.crop.emoji} {s.plot.name}</option>
          ))}
        </select>
        <TypeFilter value={type} onChange={setType} />
      </div>
      <div className="cal-layout">
        <div>
          <MonthNav year={ym.y} month={ym.m} onChange={(y, m) => setYm({ y, m })} />
          <CalendarGrid
            year={ym.y}
            month={ym.m}
            tasks={tasks}
            stages={single?.stages}
            selected={selected}
            onSelect={setSelected}
            label={plotId === 'all' ? (t) => `${t.crop.emoji} ${t.title}` : undefined}
          />
        </div>
        <aside className="card day-panel">
          <h3>{formatDate(selected, true)}</h3>
          {dayTasks.length ? (
            <ul className="task-list">
              {dayTasks.map((t) => (
                <TaskRow key={t.plotId + t.key} task={t} plot={t.plot} showPlot />
              ))}
            </ul>
          ) : (
            <p className="muted">Không có công việc trong ngày.</p>
          )}
        </aside>
      </div>
    </div>
  )
}
