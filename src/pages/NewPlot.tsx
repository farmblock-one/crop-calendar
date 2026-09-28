import { useMemo, useState } from 'react'
import { StageBar } from '../components/Timeline'
import { Field } from '../components/ui'
import { TASK_TYPES } from '../data/crops'
import { formatDate, today } from '../lib/date'
import { navigate } from '../lib/hooks'
import { buildStages, buildTasks } from '../lib/schedule'
import { uid, useStore } from '../store'
import type { Plot, TaskType } from '../types'

export function NewPlot({ cropId: initialCrop }: { cropId?: string }) {
  const { state, dispatch } = useStore()
  const [cropId, setCropId] = useState(initialCrop ?? state.crops[0]?.id ?? '')
  const [plantingDate, setPlantingDate] = useState(today())
  const [name, setName] = useState('')
  const [area, setArea] = useState('')
  const [location, setLocation] = useState('')
  const crop = state.crops.find((c) => c.id === cropId)

  const draft: Plot = useMemo(
    () => ({
      id: uid('plot-'),
      name: name.trim() || (crop ? `Khu ${crop.name} mới` : 'Khu trồng mới'),
      cropId,
      plantingDate,
      area: area.trim() || undefined,
      location: location.trim() || undefined,
      stageAdjust: {},
      overrides: {},
      customTasks: [],
      logs: [],
      createdAt: today(),
    }),
    [name, cropId, plantingDate, area, location, crop],
  )
  const stages = crop ? buildStages(draft, crop) : []
  const tasks = crop ? buildTasks(draft, crop, stages) : []
  const counts = tasks.reduce<Partial<Record<TaskType, number>>>((acc, t) => ({ ...acc, [t.type]: (acc[t.type] ?? 0) + 1 }), {})

  const create = () => {
    dispatch({ type: 'addPlot', plot: draft })
    navigate(`/plots/${draft.id}`)
  }

  return (
    <div className="page narrow">
      <a className="back" href="#/">← Tổng quan</a>
      <h1>Thêm khu trồng</h1>
      <p className="muted">Chọn loại cây và ngày trồng — hệ thống tự sinh lịch các giai đoạn và công việc theo quy trình mẫu.</p>

      <h2 className="step"><span>1</span> Chọn loại cây</h2>
      <div className="crop-picker">
        {state.crops.map((c) => (
          <button key={c.id} className={c.id === cropId ? 'crop-option on' : 'crop-option'} onClick={() => setCropId(c.id)}>
            <span className="crop-emoji big" aria-hidden>{c.emoji}</span>
            <strong>{c.name}</strong>
            <span className="muted small">{c.variety}</span>
            <span className="muted small">
              {c.stages.length} giai đoạn · {c.stages.reduce((n, s) => n + s.days, 0)} ngày
            </span>
          </button>
        ))}
        <a className="crop-option add" href="#/library/new">
          <span className="crop-emoji big" aria-hidden>＋</span>
          <strong>Quy trình mới</strong>
          <span className="muted small">Tạo trong thư viện</span>
        </a>
      </div>

      <h2 className="step"><span>2</span> Ngày trồng & khu trồng</h2>
      <div className="card form-card">
        <div className="row">
          <Field
            label={crop?.perennial ? 'Ngày bắt đầu chu kỳ' : 'Ngày trồng / gieo sạ'}
            hint={crop?.perennial ? 'Cây lâu năm: thường là ngày kết thúc thu hoạch vụ trước.' : undefined}
          >
            <input type="date" value={plantingDate} onChange={(e) => e.target.value && setPlantingDate(e.target.value)} />
          </Field>
          <Field label="Tên khu trồng">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={draft.name} />
          </Field>
        </div>
        <div className="row">
          <Field label="Diện tích"><input value={area} onChange={(e) => setArea(e.target.value)} placeholder="VD: 1,2 ha" /></Field>
          <Field label="Vị trí"><input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="VD: Lô 3, Cư Kuin" /></Field>
        </div>
      </div>

      {crop && (
        <>
          <h2 className="step"><span>3</span> Xem trước lịch mẫu</h2>
          <div className="card form-card">
            <StageBar stages={stages} showLabels />
            <table className="stage-table">
              <thead>
                <tr><th>Giai đoạn</th><th>Từ</th><th>Đến</th><th>Số ngày</th><th>Việc</th></tr>
              </thead>
              <tbody>
                {stages.map((s) => (
                  <tr key={s.template.id}>
                    <td><span className="stage-dot" style={{ background: s.template.color }} /> {s.template.name}</td>
                    <td>{formatDate(s.start)}</td>
                    <td>{formatDate(s.end)}</td>
                    <td>{s.days}</td>
                    <td>{tasks.filter((t) => t.stageId === s.template.id).length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="row wrap">
              {(Object.keys(counts) as TaskType[]).map((k) => (
                <span key={k} className="tag">{TASK_TYPES[k].icon} {counts[k]} lần {TASK_TYPES[k].label.toLowerCase()}</span>
              ))}
            </div>
          </div>
          <div className="row end">
            <a className="btn" href="#/">Hủy</a>
            <button className="btn primary" onClick={create}>Tạo lịch mùa vụ</button>
          </div>
        </>
      )}
    </div>
  )
}
