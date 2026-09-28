import { describe, expect, it } from 'vitest'
import { BUILT_IN_CROPS } from '../data/crops'
import type { CropProfile, Plot } from '../types'
import { addDays, diffDays, monthGrid } from './date'
import { buildStages, buildTasks, plotStatus } from './schedule'

const crop: CropProfile = {
  id: 'test',
  name: 'Test',
  emoji: '🌱',
  variety: '',
  climate: '',
  description: '',
  perennial: false,
  stages: [
    {
      id: 's1',
      name: 'Một',
      days: 10,
      color: '#000',
      description: '',
      tasks: [
        { id: 'w', title: 'Tưới', type: 'water', offsetDay: 0, repeatEvery: 3 },
        { id: 'f', title: 'Bón', type: 'fertilize', offsetDay: 5 },
      ],
    },
    { id: 's2', name: 'Hai', days: 5, color: '#111', description: '', tasks: [{ id: 'h', title: 'Thu', type: 'harvest', offsetDay: 4 }] },
  ],
}

function plot(patch: Partial<Plot> = {}): Plot {
  return {
    id: 'p',
    name: 'P',
    cropId: 'test',
    plantingDate: '2026-01-30',
    stageAdjust: {},
    overrides: {},
    customTasks: [],
    logs: [],
    createdAt: '2026-01-01',
    ...patch,
  }
}

describe('date helpers', () => {
  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-01-30', 3)).toBe('2026-02-02')
    expect(addDays('2025-12-31', 1)).toBe('2026-01-01')
    expect(diffDays('2026-03-01', '2026-02-01')).toBe(28)
  })
  it('builds a Monday-first month grid', () => {
    const grid = monthGrid(2026, 8) // September 2026 starts on a Tuesday
    expect(grid[0]).toBe('2026-08-31')
    expect(grid).toHaveLength(42)
  })
})

describe('buildStages', () => {
  it('chains stages from the planting date', () => {
    const stages = buildStages(plot(), crop)
    expect(stages.map((s) => [s.start, s.end])).toEqual([
      ['2026-01-30', '2026-02-08'],
      ['2026-02-09', '2026-02-13'],
    ])
  })
  it('applies engineer adjustments and shifts later stages', () => {
    const stages = buildStages(plot({ stageAdjust: { s1: 4 } }), crop)
    expect(stages[0].days).toBe(14)
    expect(stages[1].start).toBe('2026-02-13')
  })
  it('never shrinks a stage below one day', () => {
    expect(buildStages(plot({ stageAdjust: { s1: -50 } }), crop)[0].days).toBe(1)
  })
})

describe('buildTasks', () => {
  it('expands repeating tasks inside the stage only', () => {
    const tasks = buildTasks(plot(), crop)
    expect(tasks.filter((t) => t.type === 'water').map((t) => t.date)).toEqual([
      '2026-01-30',
      '2026-02-02',
      '2026-02-05',
      '2026-02-08',
    ])
    expect(tasks.find((t) => t.key === 'h#0')?.date).toBe('2026-02-13')
  })
  it('applies overrides and custom tasks', () => {
    const tasks = buildTasks(
      plot({
        overrides: { 'f#0': { date: '2026-02-06', done: true } },
        customTasks: [{ id: 'c', title: 'Drone', type: 'pest', date: '2026-02-10' }],
      }),
      crop,
    )
    const f = tasks.find((t) => t.key === 'f#0')!
    expect(f).toMatchObject({ plannedDate: '2026-02-04', date: '2026-02-06', done: true, rescheduled: true })
    expect(tasks.find((t) => t.key === 'custom:c')).toMatchObject({ stageId: 's2', custom: true })
  })
  it('drops one-off tasks whose offset falls outside a shortened stage', () => {
    const tasks = buildTasks(plot({ stageAdjust: { s1: -6 } }), crop)
    expect(tasks.some((t) => t.key === 'f#0')).toBe(false)
  })
})

describe('plotStatus', () => {
  const stages = buildStages(plot(), crop)
  it('reports the active stage', () => {
    const s = plotStatus(stages, '2026-02-10')
    expect(s.kind === 'active' && [s.stage.template.id, s.dayInStage]).toEqual(['s2', 2])
  })
  it('reports upcoming and finished', () => {
    expect(plotStatus(stages, '2026-01-01')).toEqual({ kind: 'upcoming', daysUntil: 29 })
    expect(plotStatus(stages, '2026-02-20')).toEqual({ kind: 'finished', daysAgo: 7 })
  })
})

describe('built-in library', () => {
  it.each(BUILT_IN_CROPS)('$name has valid stages and task offsets', (c) => {
    const ids = new Set<string>()
    for (const s of c.stages) {
      expect(s.days).toBeGreaterThan(0)
      for (const t of s.tasks) {
        expect(t.offsetDay).toBeLessThan(s.days)
        expect(ids.has(t.id)).toBe(false)
        ids.add(t.id)
      }
    }
  })
})
