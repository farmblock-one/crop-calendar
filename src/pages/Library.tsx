import { useState } from 'react'
import { Empty, Field, TypeChip } from '../components/ui'
import { STAGE_COLORS, TASK_TYPES } from '../data/crops'
import { navigate } from '../lib/hooks'
import { uid, useStore } from '../store'
import type { CropProfile, StageTemplate, TaskTemplate, TaskType } from '../types'

export function Library() {
  const { state } = useStore()
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Thư viện quy trình</h1>
          <p className="muted">Quy trình canh tác mẫu theo cây trồng và vùng khí hậu. Chỉnh sửa hoặc nhân bản để tạo quy trình riêng.</p>
        </div>
        <a className="btn primary" href="#/library/new">+ Quy trình mới</a>
      </div>
      <div className="lib-grid">
        {state.crops.map((c) => {
          const used = state.plots.filter((p) => p.cropId === c.id).length
          const total = c.stages.reduce((n, s) => n + s.days, 0)
          return (
            <a key={c.id} className="card lib-card" href={`#/library/${c.id}`}>
              <div className="plot-card-head">
                <span className="crop-emoji big" aria-hidden>{c.emoji}</span>
                <div className="grow">
                  <div className="plot-name">{c.name}</div>
                  <div className="muted small">{c.variety} · {c.climate}</div>
                </div>
                {c.perennial && <span className="tag">Lâu năm</span>}
              </div>
              <p className="muted small clamp">{c.description}</p>
              <div className="stage-track static">
                {c.stages.map((s) => (
                  <div key={s.id} className="seg-stage" style={{ flexGrow: s.days, background: s.color }} title={`${s.name} (${s.days} ngày)`} />
                ))}
              </div>
              <div className="muted small">
                {c.stages.length} giai đoạn · {total} ngày · {c.stages.reduce((n, s) => n + s.tasks.length, 0)} đầu việc
                {used > 0 && ` · ${used} khu trồng đang dùng`}
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}

function blankCrop(): CropProfile {
  return {
    id: uid('crop-'),
    name: '',
    emoji: '🌱',
    variety: '',
    climate: '',
    description: '',
    perennial: false,
    stages: [
      { id: uid('st-'), name: 'Giai đoạn 1', days: 30, color: STAGE_COLORS[0], description: '', tasks: [] },
    ],
  }
}

function duplicate(c: CropProfile): CropProfile {
  return {
    ...structuredClone(c),
    id: uid('crop-'),
    name: `${c.name} (bản sao)`,
    builtIn: false,
    stages: c.stages.map((s) => ({
      ...structuredClone(s),
      id: uid('st-'),
      tasks: s.tasks.map((t) => ({ ...t, id: uid('tk-') })),
    })),
  }
}

export function CropEditor({ id, from }: { id: string; from?: string }) {
  const { state, dispatch } = useStore()
  const existing = state.crops.find((c) => c.id === id)
  const source = from ? state.crops.find((c) => c.id === from) : undefined
  const [crop, setCrop] = useState<CropProfile | undefined>(() =>
    existing ? structuredClone(existing) : id === 'new' ? (source ? duplicate(source) : blankCrop()) : undefined,
  )
  const [dirty, setDirty] = useState(id === 'new')

  if (!crop) {
    return (
      <div className="page">
        <Empty icon="🔍">Không tìm thấy quy trình. <a href="#/library">Về thư viện</a></Empty>
      </div>
    )
  }

  const usedBy = state.plots.filter((p) => p.cropId === crop.id)
  const update = (patch: Partial<CropProfile>) => {
    setCrop({ ...crop, ...patch })
    setDirty(true)
  }
  const updateStage = (i: number, patch: Partial<StageTemplate>) =>
    update({ stages: crop.stages.map((s, j) => (j === i ? { ...s, ...patch } : s)) })
  const updateTask = (si: number, ti: number, patch: Partial<TaskTemplate>) =>
    updateStage(si, { tasks: crop.stages[si].tasks.map((t, j) => (j === ti ? { ...t, ...patch } : t)) })
  const moveStage = (i: number, d: number) => {
    const stages = [...crop.stages]
    const [s] = stages.splice(i, 1)
    stages.splice(i + d, 0, s)
    update({ stages })
  }

  const valid = crop.name.trim() && crop.stages.length > 0 && crop.stages.every((s) => s.name.trim() && s.days > 0)
  const save = () => {
    dispatch({ type: 'upsertCrop', crop: { ...crop, name: crop.name.trim() } })
    setDirty(false)
    if (id === 'new') navigate(`/library/${crop.id}`)
  }
  const total = crop.stages.reduce((n, s) => n + s.days, 0)

  return (
    <div className="page">
      <a className="back" href="#/library">← Thư viện quy trình</a>
      <div className="page-head">
        <div className="plot-title">
          <span className="crop-emoji big" aria-hidden>{crop.emoji}</span>
          <div>
            <h1>{crop.name || 'Quy trình mới'}</h1>
            <p className="muted">
              {crop.stages.length} giai đoạn · {total} ngày
              {usedBy.length > 0 && ` · đang dùng cho ${usedBy.map((p) => p.name).join(', ')}`}
            </p>
          </div>
        </div>
        <div className="row wrap">
          {existing && (
            <>
              <a className="btn" href={`#/plots/new/${crop.id}`}>Áp dụng cho khu trồng</a>
              <a className="btn" href={`#/library/new/${crop.id}`}>Nhân bản</a>
              <button
                className="btn danger ghost"
                disabled={usedBy.length > 0}
                title={usedBy.length ? 'Đang có khu trồng dùng quy trình này' : undefined}
                onClick={() => {
                  if (confirm(`Xóa quy trình "${crop.name}"?`)) {
                    dispatch({ type: 'deleteCrop', id: crop.id })
                    navigate('/library')
                  }
                }}
              >
                Xóa
              </button>
            </>
          )}
          <button className="btn primary" disabled={!dirty || !valid} onClick={save}>
            {dirty ? 'Lưu quy trình' : 'Đã lưu'}
          </button>
        </div>
      </div>

      {usedBy.length > 0 && dirty && (
        <p className="notice">Lưu thay đổi sẽ cập nhật lịch của {usedBy.length} khu trồng đang dùng quy trình này.</p>
      )}

      <div className="card form-card">
        <div className="row">
          <Field label="Biểu tượng">
            <input className="emoji-input" value={crop.emoji} maxLength={4} onChange={(e) => update({ emoji: e.target.value })} />
          </Field>
          <Field label="Tên cây trồng"><input value={crop.name} onChange={(e) => update({ name: e.target.value })} placeholder="VD: Hồ tiêu" /></Field>
          <Field label="Giống"><input value={crop.variety} onChange={(e) => update({ variety: e.target.value })} /></Field>
          <Field label="Vùng khí hậu"><input value={crop.climate} onChange={(e) => update({ climate: e.target.value })} /></Field>
        </div>
        <Field label="Mô tả">
          <textarea rows={2} value={crop.description} onChange={(e) => update({ description: e.target.value })} />
        </Field>
        <label className="toggle">
          <input type="checkbox" checked={crop.perennial} onChange={(e) => update({ perennial: e.target.checked })} />
          Cây lâu năm (chu kỳ tính từ ngày bắt đầu vụ, không phải ngày trồng)
        </label>
      </div>

      <h2 className="section-title">Các giai đoạn sinh trưởng</h2>
      {crop.stages.map((s, si) => (
        <div key={s.id} className="card stage-editor" style={{ '--stage': s.color } as React.CSSProperties}>
          <div className="stage-editor-head">
            <input
              type="color"
              value={s.color}
              onChange={(e) => updateStage(si, { color: e.target.value })}
              aria-label="Màu giai đoạn"
            />
            <input className="grow stage-name-input" value={s.name} onChange={(e) => updateStage(si, { name: e.target.value })} aria-label="Tên giai đoạn" />
            <label className="days-input">
              <input type="number" min={1} value={s.days} onChange={(e) => updateStage(si, { days: Math.max(1, Number(e.target.value)) })} />
              ngày
            </label>
            <button className="icon-btn" disabled={si === 0} onClick={() => moveStage(si, -1)} aria-label="Lên">↑</button>
            <button className="icon-btn" disabled={si === crop.stages.length - 1} onClick={() => moveStage(si, 1)} aria-label="Xuống">↓</button>
            <button
              className="icon-btn"
              disabled={crop.stages.length === 1}
              onClick={() => update({ stages: crop.stages.filter((_, j) => j !== si) })}
              aria-label="Xóa giai đoạn"
            >
              ✕
            </button>
          </div>
          <input
            className="stage-desc"
            value={s.description}
            placeholder="Mô tả giai đoạn"
            onChange={(e) => updateStage(si, { description: e.target.value })}
          />
          <div className="task-table-wrap">
            <table className="task-table">
              <thead>
                <tr>
                  <th>Công việc</th>
                  <th>Loại</th>
                  <th title="Ngày thứ mấy kể từ đầu giai đoạn (bắt đầu từ 0)">Ngày bắt đầu</th>
                  <th title="0 = làm 1 lần">Lặp mỗi (ngày)</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {s.tasks.map((t, ti) => (
                  <tr key={t.id}>
                    <td>
                      <input value={t.title} onChange={(e) => updateTask(si, ti, { title: e.target.value })} aria-label="Tên công việc" />
                    </td>
                    <td>
                      <select value={t.type} onChange={(e) => updateTask(si, ti, { type: e.target.value as TaskType })} aria-label="Loại">
                        {(Object.keys(TASK_TYPES) as TaskType[]).map((k) => (
                          <option key={k} value={k}>{TASK_TYPES[k].icon} {TASK_TYPES[k].label}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        max={s.days - 1}
                        value={t.offsetDay}
                        onChange={(e) => updateTask(si, ti, { offsetDay: Math.max(0, Number(e.target.value)) })}
                        aria-label="Ngày bắt đầu"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        value={t.repeatEvery ?? 0}
                        onChange={(e) => updateTask(si, ti, { repeatEvery: Number(e.target.value) > 0 ? Number(e.target.value) : undefined })}
                        aria-label="Lặp mỗi"
                      />
                    </td>
                    <td>
                      <button
                        className="icon-btn"
                        onClick={() => updateStage(si, { tasks: s.tasks.filter((_, j) => j !== ti) })}
                        aria-label="Xóa công việc"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="row wrap">
            <button
              className="btn small"
              onClick={() =>
                updateStage(si, {
                  tasks: [...s.tasks, { id: uid('tk-'), title: 'Công việc mới', type: 'other', offsetDay: 0 }],
                })
              }
            >
              + Công việc
            </button>
            <span className="muted small">
              {s.tasks.map((t) => <TypeChip key={t.id} type={t.type} compact />)}
            </span>
          </div>
        </div>
      ))}
      <button
        className="btn"
        onClick={() =>
          update({
            stages: [
              ...crop.stages,
              {
                id: uid('st-'),
                name: `Giai đoạn ${crop.stages.length + 1}`,
                days: 30,
                color: STAGE_COLORS[crop.stages.length % STAGE_COLORS.length],
                description: '',
                tasks: [],
              },
            ],
          })
        }
      >
        + Thêm giai đoạn
      </button>
    </div>
  )
}
