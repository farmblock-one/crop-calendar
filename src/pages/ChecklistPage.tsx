import { useState } from 'react'
import { TaskRow } from '../components/TaskRow'
import { Empty, TypeFilter } from '../components/ui'
import { addDays, formatDate, today } from '../lib/date'
import { useAllTasks, useSchedules, type TaskWithPlot } from '../lib/hooks'
import { buildICS, downloadFile } from '../lib/ics'
import { isOpen, isOverdue } from '../lib/schedule'
import type { TaskType } from '../types'

const RANGES = [
  { days: 7, label: '7 ngày' },
  { days: 14, label: '14 ngày' },
  { days: 30, label: '30 ngày' },
]

export function ChecklistPage() {
  const schedules = useSchedules()
  const all = useAllTasks()
  const [plotId, setPlotId] = useState('all')
  const [type, setType] = useState<TaskType | 'all'>('all')
  const [range, setRange] = useState(7)
  const t0 = today()
  const end = addDays(t0, range)

  const tasks = all.filter(
    (t) => (plotId === 'all' || t.plotId === plotId) && (type === 'all' || t.type === type),
  )
  const overdue = tasks.filter((t) => isOverdue(t))
  const doneToday = tasks.filter((t) => t.done && t.date === t0)
  const upcoming = tasks.filter((t) => t.date >= t0 && t.date <= end && isOpen(t))

  const byDay = new Map<string, TaskWithPlot[]>()
  for (const t of upcoming) byDay.set(t.date, [...(byDay.get(t.date) ?? []), t])

  const exportICS = () =>
    downloadFile(
      'crop-calendar.ics',
      buildICS(
        'Crop Calendar – FarmBlock',
        tasks.filter((t) => isOpen(t) && t.date >= t0).map((t) => ({ ...t, plotName: t.plot.name })),
      ),
    )

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Checklist công việc</h1>
          <p className="muted">Việc trễ hạn và việc sắp tới, đánh dấu ngay khi hoàn thành.</p>
        </div>
        <button className="btn" onClick={exportICS} title="Tải file .ics để nhập vào Google Calendar / điện thoại, có nhắc lúc 6:00 sáng">
          📅 Xuất lịch nhắc (.ics)
        </button>
      </div>
      <div className="toolbar">
        <select value={plotId} onChange={(e) => setPlotId(e.target.value)} aria-label="Chọn khu trồng">
          <option value="all">Tất cả khu trồng</option>
          {schedules.map((s) => (
            <option key={s.plot.id} value={s.plot.id}>{s.crop.emoji} {s.plot.name}</option>
          ))}
        </select>
        <div className="seg" role="group" aria-label="Khoảng thời gian">
          {RANGES.map((r) => (
            <button key={r.days} className={range === r.days ? 'on' : ''} onClick={() => setRange(r.days)}>{r.label}</button>
          ))}
        </div>
        <TypeFilter value={type} onChange={setType} />
      </div>

      {overdue.length > 0 && (
        <section>
          <h3 className="group-title alert-text">⚠️ Trễ hạn ({overdue.length})</h3>
          <ul className="task-list card">
            {overdue.map((t) => <TaskRow key={t.plotId + t.key} task={t} plot={t.plot} showPlot />)}
          </ul>
        </section>
      )}

      {[...byDay.entries()].map(([day, list]) => (
        <section key={day}>
          <h3 className="group-title">
            {day === t0 ? 'Hôm nay · ' : ''}
            {formatDate(day, true)} <span className="muted">({list.length})</span>
          </h3>
          <ul className="task-list card">
            {list.map((t) => <TaskRow key={t.plotId + t.key} task={t} plot={t.plot} showPlot />)}
          </ul>
        </section>
      ))}

      {doneToday.length > 0 && (
        <section>
          <h3 className="group-title muted">Đã hoàn thành hôm nay ({doneToday.length})</h3>
          <ul className="task-list card">
            {doneToday.map((t) => <TaskRow key={t.plotId + t.key} task={t} plot={t.plot} showPlot />)}
          </ul>
        </section>
      )}

      {overdue.length === 0 && upcoming.length === 0 && (
        <Empty icon="🎉">Không có việc nào trong {range} ngày tới.</Empty>
      )}
    </div>
  )
}
