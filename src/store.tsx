import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { BUILT_IN_CROPS } from './data/crops'
import { addDays, formatDate, today } from './lib/date'
import { buildTasks, isOpen } from './lib/schedule'
import type { CropProfile, CustomTask, OccurrenceOverride, Plot } from './types'

const STORAGE_KEY = 'crop-calendar/v1'

export interface State {
  crops: CropProfile[]
  plots: Plot[]
}

type Action =
  | { type: 'addPlot'; plot: Plot }
  | { type: 'updatePlot'; id: string; patch: Partial<Plot> }
  | { type: 'deletePlot'; id: string }
  | { type: 'setOverride'; plotId: string; key: string; patch: OccurrenceOverride }
  | { type: 'resetOverride'; plotId: string; key: string }
  | { type: 'adjustStage'; plotId: string; stageId: string; delta: number }
  | { type: 'shiftOpenTasks'; plotId: string; from: string; days: number; reason: string }
  | { type: 'addCustomTask'; plotId: string; task: CustomTask }
  | { type: 'deleteCustomTask'; plotId: string; taskId: string }
  | { type: 'addLog'; plotId: string; text: string; date: string }
  | { type: 'deleteLog'; plotId: string; logId: string }
  | { type: 'upsertCrop'; crop: CropProfile }
  | { type: 'deleteCrop'; id: string }
  | { type: 'reset'; state: State }

export function uid(prefix = ''): string {
  return prefix + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4)
}

function mapPlot(state: State, id: string, fn: (p: Plot) => Plot): State {
  return { ...state, plots: state.plots.map((p) => (p.id === id ? fn(p) : p)) }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'addPlot':
      return { ...state, plots: [...state.plots, action.plot] }
    case 'updatePlot':
      return mapPlot(state, action.id, (p) => ({ ...p, ...action.patch }))
    case 'deletePlot':
      return { ...state, plots: state.plots.filter((p) => p.id !== action.id) }
    case 'setOverride':
      return mapPlot(state, action.plotId, (p) => ({
        ...p,
        overrides: { ...p.overrides, [action.key]: { ...p.overrides[action.key], ...action.patch } },
      }))
    case 'resetOverride':
      return mapPlot(state, action.plotId, (p) => {
        const overrides = { ...p.overrides }
        delete overrides[action.key]
        return { ...p, overrides }
      })
    case 'adjustStage':
      return mapPlot(state, action.plotId, (p) => ({
        ...p,
        stageAdjust: { ...p.stageAdjust, [action.stageId]: (p.stageAdjust[action.stageId] ?? 0) + action.delta },
      }))
    case 'shiftOpenTasks':
      return mapPlot(state, action.plotId, (p) => {
        const crop = state.crops.find((c) => c.id === p.cropId)
        if (!crop) return p
        const overrides = { ...p.overrides }
        for (const t of buildTasks(p, crop)) {
          if (isOpen(t) && t.date >= action.from) {
            overrides[t.key] = { ...overrides[t.key], date: addDays(t.date, action.days) }
          }
        }
        const log = {
          id: uid('log-'),
          date: today(),
          text: `Dời ${action.days > 0 ? '+' : ''}${action.days} ngày các việc chưa làm từ ${formatDate(action.from)}: ${action.reason}`,
        }
        return { ...p, overrides, logs: [log, ...p.logs] }
      })
    case 'addCustomTask':
      return mapPlot(state, action.plotId, (p) => ({ ...p, customTasks: [...p.customTasks, action.task] }))
    case 'deleteCustomTask':
      return mapPlot(state, action.plotId, (p) => ({
        ...p,
        customTasks: p.customTasks.filter((t) => t.id !== action.taskId),
      }))
    case 'addLog':
      return mapPlot(state, action.plotId, (p) => ({
        ...p,
        logs: [{ id: uid('log-'), date: action.date, text: action.text }, ...p.logs].sort((a, b) =>
          b.date.localeCompare(a.date),
        ),
      }))
    case 'deleteLog':
      return mapPlot(state, action.plotId, (p) => ({ ...p, logs: p.logs.filter((l) => l.id !== action.logId) }))
    case 'upsertCrop': {
      const exists = state.crops.some((c) => c.id === action.crop.id)
      return {
        ...state,
        crops: exists ? state.crops.map((c) => (c.id === action.crop.id ? action.crop : c)) : [...state.crops, action.crop],
      }
    }
    case 'deleteCrop':
      return { ...state, crops: state.crops.filter((c) => c.id !== action.id) }
    case 'reset':
      return action.state
  }
}

function demoPlot(id: string, name: string, cropId: string, daysAgo: number, area: string, location: string): Plot {
  return {
    id,
    name,
    cropId,
    plantingDate: addDays(today(), -daysAgo),
    area,
    location,
    stageAdjust: {},
    overrides: {},
    customTasks: [],
    logs: [],
    createdAt: today(),
  }
}

/** Demo data: three plots at different points of their cycle, older tasks already ticked off. */
export function demoState(): State {
  const crops = structuredClone(BUILT_IN_CROPS)
  const plots = [
    demoPlot('plot-durian-a1', 'Vườn sầu riêng A1', 'durian', 132, '2,5 ha', 'Krông Pắc, Đắk Lắk'),
    demoPlot('plot-coffee-b2', 'Lô cà phê B2', 'coffee', 205, '3 ha', 'Cư M’gar, Đắk Lắk'),
    demoPlot('plot-rice-c', 'Ruộng lúa C – vụ Thu Đông', 'rice', 24, '5 ha', 'Tháp Mười, Đồng Tháp'),
  ]
  plots[0].stageAdjust['du-flush'] = 5
  const cutoff = addDays(today(), -2)
  for (const plot of plots) {
    const crop = crops.find((c) => c.id === plot.cropId)!
    for (const t of buildTasks(plot, crop)) {
      if (t.date < cutoff) plot.overrides[t.key] = { done: true, doneAt: t.date }
    }
  }
  plots[0].logs.push({
    id: 'log-demo-1',
    date: addDays(today(), -60),
    text: 'Cơi đọt 2 ra chậm do nắng hạn, KS kéo dài giai đoạn nuôi cơi đọt thêm 5 ngày.',
  })
  plots[2].customTasks.push({
    id: 'demo-drone',
    title: 'Phun thuốc bằng drone (thuê dịch vụ)',
    type: 'pest',
    date: addDays(today(), 3),
  })
  return { crops, plots }
}

function load(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as State
      if (Array.isArray(parsed.crops) && Array.isArray(parsed.plots)) return parsed
    }
  } catch {
    // Storage unavailable or corrupted → fall back to demo data.
  }
  return demoState()
}

interface Store {
  state: State
  dispatch: (action: Action) => void
  cropOf: (plot: Plot) => CropProfile | undefined
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Ignore quota / private mode errors; the app still works in memory.
    }
  }, [state])

  const value = useMemo<Store>(
    () => ({ state, dispatch, cropOf: (plot) => state.crops.find((c) => c.id === plot.cropId) }),
    [state],
  )
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore must be used inside StoreProvider')
  return store
}
