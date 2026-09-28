import { TASK_TYPES } from '../data/crops'
import { StageBar } from '../components/Timeline'
import { TaskRow } from '../components/TaskRow'
import { Empty } from '../components/ui'
import { addDays, formatDate, formatShort, today } from '../lib/date'
import { useAllTasks, useSchedules, type PlotSchedule } from '../lib/hooks'
import { cycleProgress, isOpen, isOverdue, plotStatus } from '../lib/schedule'

export function Dashboard() {
  const schedules = useSchedules()
  const tasks = useAllTasks()
  const t0 = today()
  const in7 = addDays(t0, 7)
  const open = tasks.filter(isOpen)
  const overdue = open.filter((t) => isOverdue(t))
  const dueToday = open.filter((t) => t.date === t0)
  const week = open.filter((t) => t.date > t0 && t.date <= in7)
  const focus = [...overdue, ...dueToday]

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Tổng quan mùa vụ</h1>
          <p className="muted">{formatDate(t0, true)} · {schedules.length} khu trồng đang theo dõi</p>
        </div>
        <a className="btn primary" href="#/plots/new">+ Thêm khu trồng</a>
      </div>

      <div className="kpis">
        <a className="kpi" href="#/checklist">
          <span className="kpi-label">Việc hôm nay</span>
          <span className="kpi-value">{dueToday.length}</span>
        </a>
        <a className={overdue.length ? 'kpi alert' : 'kpi'} href="#/checklist">
          <span className="kpi-label">Trễ hạn</span>
          <span className="kpi-value">{overdue.length}</span>
        </a>
        <a className="kpi" href="#/checklist">
          <span className="kpi-label">7 ngày tới</span>
          <span className="kpi-value">{week.length}</span>
        </a>
        <a className="kpi" href="#/library">
          <span className="kpi-label">Quy trình cây trồng</span>
          <span className="kpi-value">{new Set(schedules.map((s) => s.crop.id)).size}<small> đang dùng</small></span>
        </a>
      </div>

      <div className="dash-grid">
        <section>
          <h2 className="section-title">Khu trồng</h2>
          {schedules.length === 0 ? (
            <Empty icon="🌱">
              Chưa có khu trồng nào. <a href="#/plots/new">Tạo khu trồng đầu tiên</a>.
            </Empty>
          ) : (
            <div className="plot-cards">
              {schedules.map((s) => (
                <PlotCard key={s.plot.id} schedule={s} />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="section-title">Cần làm ngay</h2>
          {focus.length === 0 ? (
            <Empty icon="✅">Không có việc hôm nay hoặc trễ hạn.</Empty>
          ) : (
            <ul className="task-list card">
              {focus.slice(0, 12).map((t) => (
                <TaskRow key={t.plotId + t.key} task={t} plot={t.plot} showPlot />
              ))}
            </ul>
          )}
          <h2 className="section-title">Sắp tới (7 ngày)</h2>
          {week.length === 0 ? (
            <Empty icon="📭">Không có việc trong 7 ngày tới.</Empty>
          ) : (
            <ul className="task-list card">
              {week.slice(0, 10).map((t) => (
                <TaskRow key={t.plotId + t.key} task={t} plot={t.plot} showPlot />
              ))}
            </ul>
          )}
          {week.length > 10 && <a className="more-link" href="#/checklist">Xem tất cả {week.length} việc →</a>}
        </section>
      </div>
    </div>
  )
}

function PlotCard({ schedule }: { schedule: PlotSchedule }) {
  const { plot, crop, stages, tasks } = schedule
  const status = plotStatus(stages)
  const next = tasks.filter((t) => isOpen(t) && t.date >= today()).slice(0, 3)
  const overdue = tasks.filter((t) => isOverdue(t)).length
  const pct = Math.round(cycleProgress(stages) * 100)

  return (
    <a className="plot-card card" href={`#/plots/${plot.id}`}>
      <div className="plot-card-head">
        <span className="crop-emoji" aria-hidden>{crop.emoji}</span>
        <div className="grow">
          <div className="plot-name">{plot.name}</div>
          <div className="muted small">
            {crop.name}
            {plot.area && ` · ${plot.area}`}
            {plot.location && ` · ${plot.location}`}
          </div>
        </div>
        {overdue > 0 && <span className="badge alert">{overdue} trễ</span>}
      </div>

      <div className="plot-status">
        {status.kind === 'active' && (
          <>
            <span className="stage-dot" style={{ background: status.stage.template.color }} />
            <strong>{status.stage.template.name}</strong>
            <span className="muted">
              ngày {status.dayInStage}/{status.stage.days}
            </span>
          </>
        )}
        {status.kind === 'upcoming' && <strong>Bắt đầu sau {status.daysUntil} ngày</strong>}
        {status.kind === 'finished' && <strong>Đã kết thúc chu kỳ {status.daysAgo} ngày trước</strong>}
        <span className="spacer" />
        <span className="muted small">{pct}% chu kỳ</span>
      </div>
      <StageBar stages={stages} />

      <ul className="mini-tasks">
        {next.map((t) => (
          <li key={t.key}>
            <span className="mini-date">{formatShort(t.date)}</span>
            <span aria-hidden>{TASK_TYPES[t.type].icon}</span>
            <span className="ellipsis">{t.title}</span>
          </li>
        ))}
        {next.length === 0 && <li className="muted">Không còn việc sắp tới</li>}
      </ul>
    </a>
  )
}
