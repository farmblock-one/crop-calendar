import { useState } from 'react'
import { TASK_TYPES } from '../data/crops'
import { addDays, diffDays, formatDate, formatShort, relativeLabel, today } from '../lib/date'
import { navigate } from '../lib/hooks'
import { isOverdue } from '../lib/schedule'
import { useStore } from '../store'
import type { Plot, TaskOccurrence } from '../types'
import { Field, Modal, TypeChip } from './ui'

export function TaskRow({ task, plot, showPlot, showStage = true }: {
  task: TaskOccurrence
  plot: Plot
  showPlot?: boolean
  showStage?: boolean
}) {
  const { dispatch } = useStore()
  const [editing, setEditing] = useState(false)
  const overdue = isOverdue(task)
  const toggle = () =>
    dispatch({
      type: 'setOverride',
      plotId: plot.id,
      key: task.key,
      patch: task.done ? { done: false, doneAt: undefined } : { done: true, doneAt: today(), skipped: false },
    })

  const cls = ['task-row', task.done && 'done', task.skipped && 'skipped', overdue && 'overdue'].filter(Boolean).join(' ')
  return (
    <li className={cls} style={{ '--type': TASK_TYPES[task.type].color } as React.CSSProperties}>
      <button
        className="check"
        role="checkbox"
        aria-checked={task.done}
        aria-label={task.done ? 'Bỏ đánh dấu hoàn thành' : 'Đánh dấu hoàn thành'}
        onClick={toggle}
      >
        {task.done ? '✓' : ''}
      </button>
      <div className="task-main">
        <div className="task-title">
          <span aria-hidden>{TASK_TYPES[task.type].icon}</span> {task.title}
          {task.custom && <span className="tag">Thêm bởi KS</span>}
          {task.rescheduled && (
            <span className="tag warn" title={`Lịch gốc: ${formatDate(task.plannedDate)}`}>
              Dời {diffDays(task.date, task.plannedDate) > 0 ? '+' : ''}
              {diffDays(task.date, task.plannedDate)} ngày
            </span>
          )}
          {task.skipped && <span className="tag">Bỏ qua</span>}
        </div>
        <div className="task-meta">
          {showPlot && (
            <a href={`#/plots/${plot.id}`} className="plot-link">
              {plot.name}
            </a>
          )}
          {showStage && task.stageName && <span>{task.stageName}</span>}
          {task.note && <span className="task-note">📝 {task.note}</span>}
        </div>
      </div>
      <div className="task-when">
        <div className="task-date">{formatShort(task.date)}</div>
        {!task.done && !task.skipped && <div className={overdue ? 'rel overdue' : 'rel'}>{relativeLabel(task.date)}</div>}
      </div>
      <button className="icon-btn" onClick={() => setEditing(true)} aria-label="Điều chỉnh công việc" title="Điều chỉnh">
        ⋯
      </button>
      {editing && <TaskEditModal task={task} plot={plot} onClose={() => setEditing(false)} />}
    </li>
  )
}

export function TaskEditModal({ task, plot, onClose }: { task: TaskOccurrence; plot: Plot; onClose: () => void }) {
  const { dispatch } = useStore()
  const [date, setDate] = useState(task.date)
  const [note, setNote] = useState(task.note ?? '')

  const save = () => {
    dispatch({
      type: 'setOverride',
      plotId: plot.id,
      key: task.key,
      patch: { date: date === task.plannedDate ? undefined : date, note: note.trim() || undefined },
    })
    onClose()
  }
  const setStatus = (patch: { skipped?: boolean; done?: boolean }) => {
    dispatch({ type: 'setOverride', plotId: plot.id, key: task.key, patch })
    onClose()
  }

  return (
    <Modal
      title="Điều chỉnh công việc"
      onClose={onClose}
      footer={
        <>
          {task.custom ? (
            <button
              className="btn danger ghost"
              onClick={() => {
                dispatch({ type: 'deleteCustomTask', plotId: plot.id, taskId: task.key.replace('custom:', '') })
                onClose()
              }}
            >
              Xóa việc
            </button>
          ) : (
            <button
              className="btn ghost"
              onClick={() => {
                dispatch({ type: 'resetOverride', plotId: plot.id, key: task.key })
                onClose()
              }}
            >
              Khôi phục lịch gốc
            </button>
          )}
          <span className="spacer" />
          <button className="btn" onClick={onClose}>Hủy</button>
          <button className="btn primary" onClick={save}>Lưu</button>
        </>
      }
    >
      <div className="edit-head">
        <TypeChip type={task.type} />
        <strong>{task.title}</strong>
        <span className="muted">
          {plot.name}
          {task.stageName && ` · ${task.stageName}`}
        </span>
      </div>
      <Field label="Ngày thực hiện" hint={`Lịch gốc: ${formatDate(task.plannedDate, true)}`}>
        <div className="row">
          <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
          <div className="seg small">
            {[-3, -1, 1, 3, 7].map((d) => (
              <button key={d} onClick={() => setDate(addDays(date, d))}>
                {d > 0 ? `+${d}` : d}
              </button>
            ))}
          </div>
        </div>
      </Field>
      <Field label="Ghi chú kỹ sư">
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="VD: Mưa lớn, dời sang tuần sau; liều lượng 2 kg/gốc…"
        />
      </Field>
      <div className="row wrap">
        {!task.done && <button className="btn" onClick={() => setStatus({ done: true, skipped: false })}>✓ Đánh dấu đã làm</button>}
        {task.skipped ? (
          <button className="btn" onClick={() => setStatus({ skipped: false })}>Hoàn tác bỏ qua</button>
        ) : (
          <button className="btn" onClick={() => setStatus({ skipped: true, done: false })}>Bỏ qua lần này</button>
        )}
        <button className="btn ghost" onClick={() => navigate(`/plots/${plot.id}`)}>Mở khu trồng →</button>
      </div>
    </Modal>
  )
}
