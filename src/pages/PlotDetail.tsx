import { useState } from 'react'
import { CalendarGrid, MonthNav } from '../components/CalendarGrid'
import { StageBar } from '../components/Timeline'
import { TaskRow } from '../components/TaskRow'
import { Empty, Field, Modal, TypeFilter } from '../components/ui'
import { TASK_TYPES } from '../data/crops'
import { addDays, formatDate, parseISO, today } from '../lib/date'
import { navigate, useSchedules, type PlotSchedule } from '../lib/hooks'
import { buildICS, downloadFile } from '../lib/ics'
import { cycleProgress, isOpen, isOverdue, plotStatus } from '../lib/schedule'
import { uid, useStore } from '../store'
import type { Plot, StageInstance, TaskType } from '../types'

type Tab = 'timeline' | 'checklist' | 'calendar' | 'logs'

export function PlotDetail({ id }: { id: string }) {
  const schedule = useSchedules().find((s) => s.plot.id === id)
  const [tab, setTab] = useState<Tab>('timeline')
  const [modal, setModal] = useState<'task' | 'shift' | 'edit' | null>(null)

  if (!schedule) {
    return (
      <div className="page">
        <Empty icon="🔍">
          Không tìm thấy khu trồng. <a href="#/">Về trang tổng quan</a>
        </Empty>
      </div>
    )
  }
  const { plot, crop, stages, tasks } = schedule
  const status = plotStatus(stages)
  const open = tasks.filter(isOpen)
  const overdue = open.filter((t) => isOverdue(t)).length
  const doneCount = tasks.filter((t) => t.done).length

  const exportICS = () => {
    const upcoming = tasks.filter((t) => isOpen(t) && t.date >= today()).map((t) => ({ ...t, plotName: plot.name }))
    downloadFile(`${plot.name.replace(/[^\p{L}\p{N}]+/gu, '-')}.ics`, buildICS(`${plot.name} – ${crop.name}`, upcoming))
  }

  return (
    <div className="page">
      <a className="back" href="#/">← Tổng quan</a>
      <div className="page-head">
        <div className="plot-title">
          <span className="crop-emoji big" aria-hidden>{crop.emoji}</span>
          <div>
            <h1>{plot.name}</h1>
            <p className="muted">
              <a href={`#/library/${crop.id}`}>{crop.name}</a> · {crop.variety}
              {plot.area && ` · ${plot.area}`}
              {plot.location && ` · ${plot.location}`}
            </p>
            <p className="muted small">
              {crop.perennial ? 'Bắt đầu chu kỳ' : 'Ngày trồng'}: {formatDate(plot.plantingDate, true)} → kết thúc dự kiến{' '}
              {formatDate(stages.at(-1)!.end)}
            </p>
          </div>
        </div>
        <div className="row wrap">
          <button className="btn" onClick={() => setModal('edit')}>Sửa</button>
          <button className="btn" onClick={exportICS} title="Tải lịch .ics để nhận nhắc việc trên Google Calendar / điện thoại">
            📅 Xuất lịch nhắc
          </button>
          <button className="btn" onClick={() => setModal('shift')}>⛅ Dời lịch</button>
          <button className="btn primary" onClick={() => setModal('task')}>+ Thêm việc</button>
        </div>
      </div>

      <div className="card status-card">
        <div className="status-row">
          <div>
            <div className="muted small">Giai đoạn hiện tại</div>
            {status.kind === 'active' ? (
              <div className="status-stage">
                <span className="stage-dot" style={{ background: status.stage.template.color }} />
                {status.stage.template.name}
                <span className="muted"> · ngày {status.dayInStage}/{status.stage.days}</span>
              </div>
            ) : status.kind === 'upcoming' ? (
              <div className="status-stage">Chưa bắt đầu (còn {status.daysUntil} ngày)</div>
            ) : (
              <div className="status-stage">Đã hoàn tất chu kỳ</div>
            )}
          </div>
          <div className="stat"><span>{Math.round(cycleProgress(stages) * 100)}%</span>chu kỳ</div>
          <div className="stat"><span>{doneCount}/{tasks.length}</span>việc đã làm</div>
          <div className={overdue ? 'stat alert' : 'stat'}><span>{overdue}</span>trễ hạn</div>
        </div>
        <StageBar stages={stages} showLabels />
      </div>

      <div className="tabs" role="tablist">
        {([
          ['timeline', 'Giai đoạn'],
          ['checklist', 'Checklist'],
          ['calendar', 'Lịch'],
          ['logs', `Nhật ký (${plot.logs.length})`],
        ] as [Tab, string][]).map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'timeline' && <StageTimeline schedule={schedule} />}
      {tab === 'checklist' && <PlotChecklist schedule={schedule} />}
      {tab === 'calendar' && <PlotCalendar schedule={schedule} />}
      {tab === 'logs' && <Logs plot={plot} />}

      {modal === 'task' && <AddTaskModal plot={plot} onClose={() => setModal(null)} />}
      {modal === 'shift' && <ShiftModal plot={plot} onClose={() => setModal(null)} />}
      {modal === 'edit' && <EditPlotModal plot={plot} onClose={() => setModal(null)} />}
    </div>
  )
}

function StageTimeline({ schedule }: { schedule: PlotSchedule }) {
  const { plot, stages, tasks } = schedule
  const { dispatch } = useStore()
  const t0 = today()
  const current = stages.find((s) => t0 >= s.start && t0 <= s.end)
  const [expanded, setExpanded] = useState<string | undefined>(current?.template.id)

  const adjust = (s: StageInstance, delta: number) =>
    dispatch({ type: 'adjustStage', plotId: plot.id, stageId: s.template.id, delta })

  return (
    <ol className="timeline">
      {stages.map((s) => {
        const stageTasks = tasks.filter((t) => t.stageId === s.template.id)
        const done = stageTasks.filter((t) => t.done).length
        const state = s.end < t0 ? 'past' : s === current ? 'active' : 'future'
        const isOpenStage = expanded === s.template.id
        return (
          <li key={s.template.id} className={`tl-item ${state}`} style={{ '--stage': s.template.color } as React.CSSProperties}>
            <div className="tl-dot" />
            <div className="tl-body card">
              <button className="tl-head" onClick={() => setExpanded(isOpenStage ? undefined : s.template.id)} aria-expanded={isOpenStage}>
                <div className="grow">
                  <div className="tl-name">
                    {s.index + 1}. {s.template.name}
                    {state === 'active' && <span className="badge">Đang diễn ra</span>}
                    {state === 'past' && <span className="badge muted-badge">Đã qua</span>}
                  </div>
                  <div className="muted small">
                    {formatDate(s.start)} – {formatDate(s.end)} · {s.days} ngày · {done}/{stageTasks.length} việc
                  </div>
                </div>
                <span className="chev" aria-hidden>{isOpenStage ? '▾' : '▸'}</span>
              </button>

              {isOpenStage && (
                <div className="tl-content">
                  <p className="muted">{s.template.description}</p>
                  <div className="adjust">
                    <span className="small">Điều chỉnh độ dài giai đoạn:</span>
                    <div className="seg small">
                      <button onClick={() => adjust(s, -7)}>−7</button>
                      <button onClick={() => adjust(s, -1)}>−1</button>
                      <button onClick={() => adjust(s, 1)}>+1</button>
                      <button onClick={() => adjust(s, 7)}>+7</button>
                    </div>
                    {s.adjust !== 0 && (
                      <>
                        <span className="tag warn">
                          KS {s.adjust > 0 ? '+' : ''}
                          {s.adjust} ngày (chuẩn {s.template.days})
                        </span>
                        <button className="btn small ghost" onClick={() => adjust(s, -s.adjust)}>Về chuẩn</button>
                      </>
                    )}
                  </div>
                  <p className="field-hint">Các giai đoạn sau sẽ tự dời theo.</p>
                  {stageTasks.length ? (
                    <ul className="task-list">
                      {stageTasks.map((t) => (
                        <TaskRow key={t.key} task={t} plot={plot} showStage={false} />
                      ))}
                    </ul>
                  ) : (
                    <p className="muted">Không có công việc.</p>
                  )}
                </div>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function PlotChecklist({ schedule }: { schedule: PlotSchedule }) {
  const { plot, tasks } = schedule
  const [type, setType] = useState<TaskType | 'all'>('all')
  const [showDone, setShowDone] = useState(false)
  const t0 = today()
  const filtered = tasks.filter((t) => (type === 'all' || t.type === type) && (showDone || isOpen(t)))
  const groups: [string, typeof tasks][] = [
    ['Trễ hạn', filtered.filter((t) => isOverdue(t))],
    ['Hôm nay', filtered.filter((t) => t.date === t0 && !isOverdue(t))],
    ['Sắp tới', filtered.filter((t) => t.date > t0 && t.date <= addDays(t0, 30))],
    ['Sau 30 ngày', filtered.filter((t) => t.date > addDays(t0, 30))],
    ['Đã qua', filtered.filter((t) => t.date < t0 && !isOverdue(t))],
  ]
  return (
    <div>
      <div className="toolbar">
        <TypeFilter value={type} onChange={setType} />
        <label className="toggle">
          <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} /> Hiện việc đã xong
        </label>
      </div>
      {groups.map(([label, list]) =>
        list.length ? (
          <section key={label}>
            <h3 className="group-title">{label} <span className="muted">({list.length})</span></h3>
            <ul className="task-list card">
              {list.map((t) => <TaskRow key={t.key} task={t} plot={plot} />)}
            </ul>
          </section>
        ) : null,
      )}
      {filtered.length === 0 && <Empty icon="✅">Không có công việc phù hợp.</Empty>}
    </div>
  )
}

function PlotCalendar({ schedule }: { schedule: PlotSchedule }) {
  const { plot, stages, tasks } = schedule
  const t0 = parseISO(today())
  const [ym, setYm] = useState({ y: t0.getUTCFullYear(), m: t0.getUTCMonth() })
  const [selected, setSelected] = useState(today())
  const dayTasks = tasks.filter((t) => t.date === selected)
  return (
    <div className="cal-layout">
      <div>
        <MonthNav year={ym.y} month={ym.m} onChange={(y, m) => setYm({ y, m })} />
        <CalendarGrid year={ym.y} month={ym.m} tasks={tasks} stages={stages} selected={selected} onSelect={setSelected} />
        <div className="legend">
          {stages.map((s) => (
            <span key={s.template.id}>
              <span className="stage-dot" style={{ background: s.template.color }} /> {s.template.name}
            </span>
          ))}
        </div>
      </div>
      <aside className="card day-panel">
        <h3>{formatDate(selected, true)}</h3>
        {dayTasks.length ? (
          <ul className="task-list">
            {dayTasks.map((t) => <TaskRow key={t.key} task={t} plot={plot} />)}
          </ul>
        ) : (
          <p className="muted">Không có công việc.</p>
        )}
      </aside>
    </div>
  )
}

function Logs({ plot }: { plot: Plot }) {
  const { dispatch } = useStore()
  const [text, setText] = useState('')
  const [date, setDate] = useState(today())
  const add = () => {
    if (!text.trim()) return
    dispatch({ type: 'addLog', plotId: plot.id, text: text.trim(), date })
    setText('')
  }
  return (
    <div>
      <div className="card log-form">
        <textarea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ghi nhận thực tế: thời tiết, tình trạng cây, sâu bệnh phát hiện, lượng phân đã bón…"
        />
        <div className="row">
          <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
          <span className="spacer" />
          <button className="btn primary" onClick={add} disabled={!text.trim()}>Ghi nhật ký</button>
        </div>
      </div>
      {plot.logs.length === 0 ? (
        <Empty icon="📓">Chưa có ghi chép nào.</Empty>
      ) : (
        <ul className="logs">
          {plot.logs.map((l) => (
            <li key={l.id} className="card">
              <div className="log-date">{formatDate(l.date, true)}</div>
              <div className="grow">{l.text}</div>
              <button className="icon-btn" aria-label="Xóa ghi chép" onClick={() => dispatch({ type: 'deleteLog', plotId: plot.id, logId: l.id })}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function AddTaskModal({ plot, onClose }: { plot: Plot; onClose: () => void }) {
  const { dispatch } = useStore()
  const [title, setTitle] = useState('')
  const [type, setType] = useState<TaskType>('other')
  const [date, setDate] = useState(today())
  const [note, setNote] = useState('')
  const [repeat, setRepeat] = useState(0)
  const [count, setCount] = useState(1)

  const save = () => {
    const times = repeat > 0 ? Math.max(1, Math.min(52, count)) : 1
    for (let i = 0; i < times; i++) {
      dispatch({
        type: 'addCustomTask',
        plotId: plot.id,
        task: { id: uid('t-'), title: title.trim(), type, date: addDays(date, i * repeat), note: note.trim() || undefined },
      })
    }
    onClose()
  }

  return (
    <Modal
      title="Thêm công việc"
      onClose={onClose}
      footer={
        <>
          <span className="spacer" />
          <button className="btn" onClick={onClose}>Hủy</button>
          <button className="btn primary" disabled={!title.trim()} onClick={save}>Thêm</button>
        </>
      }
    >
      <Field label="Tên công việc">
        <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Phun phòng nấm hồng sau mưa" />
      </Field>
      <Field label="Loại">
        <select value={type} onChange={(e) => setType(e.target.value as TaskType)}>
          {(Object.keys(TASK_TYPES) as TaskType[]).map((k) => (
            <option key={k} value={k}>{TASK_TYPES[k].icon} {TASK_TYPES[k].label}</option>
          ))}
        </select>
      </Field>
      <div className="row">
        <Field label="Ngày">
          <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </Field>
        <Field label="Lặp lại mỗi (ngày)" hint="0 = không lặp">
          <input type="number" min={0} value={repeat} onChange={(e) => setRepeat(Math.max(0, Number(e.target.value)))} />
        </Field>
        {repeat > 0 && (
          <Field label="Số lần">
            <input type="number" min={1} max={52} value={count} onChange={(e) => setCount(Number(e.target.value))} />
          </Field>
        )}
      </div>
      <Field label="Ghi chú">
        <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
    </Modal>
  )
}

function ShiftModal({ plot, onClose }: { plot: Plot; onClose: () => void }) {
  const { dispatch } = useStore()
  const [from, setFrom] = useState(today())
  const [days, setDays] = useState(3)
  const [reason, setReason] = useState('Mưa lớn kéo dài')
  return (
    <Modal
      title="Dời lịch theo điều kiện thực tế"
      onClose={onClose}
      footer={
        <>
          <span className="spacer" />
          <button className="btn" onClick={onClose}>Hủy</button>
          <button
            className="btn primary"
            disabled={!days}
            onClick={() => {
              dispatch({ type: 'shiftOpenTasks', plotId: plot.id, from, days, reason: reason.trim() || 'Không ghi lý do' })
              onClose()
            }}
          >
            Dời lịch
          </button>
        </>
      }
    >
      <p className="muted">
        Tất cả công việc <strong>chưa hoàn thành</strong> từ ngày đã chọn sẽ được dời đi. Thao tác được ghi vào nhật ký.
        Muốn kéo dài/rút ngắn cả giai đoạn, dùng nút ± ở tab <em>Giai đoạn</em>.
      </p>
      <div className="row">
        <Field label="Từ ngày">
          <input type="date" value={from} onChange={(e) => e.target.value && setFrom(e.target.value)} />
        </Field>
        <Field label="Số ngày dời" hint="Số âm để làm sớm hơn">
          <input type="number" value={days} onChange={(e) => setDays(Number(e.target.value))} />
        </Field>
      </div>
      <Field label="Lý do">
        <div className="row wrap">
          {['Mưa lớn kéo dài', 'Nắng hạn', 'Thiếu nhân công', 'Chờ vật tư'].map((r) => (
            <button key={r} className={reason === r ? 'btn small on' : 'btn small'} onClick={() => setReason(r)}>{r}</button>
          ))}
        </div>
        <input value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
    </Modal>
  )
}

function EditPlotModal({ plot, onClose }: { plot: Plot; onClose: () => void }) {
  const { dispatch } = useStore()
  const [form, setForm] = useState({
    name: plot.name,
    plantingDate: plot.plantingDate,
    area: plot.area ?? '',
    location: plot.location ?? '',
  })
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value })
  const shiftNote =
    form.plantingDate !== plot.plantingDate
      ? 'Đổi ngày bắt đầu sẽ dời toàn bộ lịch; các việc đã dời thủ công giữ nguyên ngày đã chọn.'
      : undefined
  return (
    <Modal
      title="Thông tin khu trồng"
      onClose={onClose}
      footer={
        <>
          <button
            className="btn danger ghost"
            onClick={() => {
              if (confirm(`Xóa khu trồng "${plot.name}"? Không thể hoàn tác.`)) {
                dispatch({ type: 'deletePlot', id: plot.id })
                navigate('/')
              }
            }}
          >
            Xóa khu trồng
          </button>
          <span className="spacer" />
          <button className="btn" onClick={onClose}>Hủy</button>
          <button
            className="btn primary"
            disabled={!form.name.trim() || !form.plantingDate}
            onClick={() => {
              dispatch({ type: 'updatePlot', id: plot.id, patch: { ...form, name: form.name.trim() } })
              onClose()
            }}
          >
            Lưu
          </button>
        </>
      }
    >
      <Field label="Tên khu trồng"><input value={form.name} onChange={set('name')} /></Field>
      <Field label="Ngày trồng / bắt đầu chu kỳ" hint={shiftNote}>
        <input type="date" value={form.plantingDate} onChange={set('plantingDate')} />
      </Field>
      <div className="row">
        <Field label="Diện tích"><input value={form.area} onChange={set('area')} /></Field>
        <Field label="Vị trí"><input value={form.location} onChange={set('location')} /></Field>
      </div>
    </Modal>
  )
}
