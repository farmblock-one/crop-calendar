import type { CropProfile, Plot, StageInstance, TaskOccurrence } from '../types'
import { addDays, diffDays, today } from './date'

export const MIN_STAGE_DAYS = 1

/** Builds the dated stage timeline of a plot, applying the engineer's stage adjustments. */
export function buildStages(plot: Plot, crop: CropProfile): StageInstance[] {
  const stages: StageInstance[] = []
  let cursor = plot.plantingDate
  crop.stages.forEach((template, index) => {
    const adjust = plot.stageAdjust[template.id] ?? 0
    const days = Math.max(MIN_STAGE_DAYS, template.days + adjust)
    const end = addDays(cursor, days - 1)
    stages.push({ template, index, start: cursor, end, days, adjust })
    cursor = addDays(end, 1)
  })
  return stages
}

export function cycleEnd(stages: StageInstance[]): string | undefined {
  return stages.at(-1)?.end
}

/** Generates every task occurrence of a plot, merged with overrides and custom tasks. */
export function buildTasks(plot: Plot, crop: CropProfile, stages = buildStages(plot, crop)): TaskOccurrence[] {
  const tasks: TaskOccurrence[] = []

  for (const stage of stages) {
    for (const t of stage.template.tasks) {
      const step = t.repeatEvery && t.repeatEvery > 0 ? t.repeatEvery : Infinity
      let n = 0
      for (let offset = t.offsetDay; offset < stage.days; offset += step) {
        const key = `${t.id}#${n}`
        const plannedDate = addDays(stage.start, offset)
        const ov = plot.overrides[key] ?? {}
        tasks.push({
          key,
          plotId: plot.id,
          title: t.title,
          type: t.type,
          plannedDate,
          date: ov.date ?? plannedDate,
          stageId: stage.template.id,
          stageName: stage.template.name,
          note: ov.note ?? t.note,
          custom: false,
          done: !!ov.done,
          skipped: !!ov.skipped,
          rescheduled: !!ov.date && ov.date !== plannedDate,
        })
        n++
        if (step === Infinity) break
      }
    }
  }

  for (const c of plot.customTasks) {
    const key = `custom:${c.id}`
    const ov = plot.overrides[key] ?? {}
    const stage = stageAt(stages, c.date)
    tasks.push({
      key,
      plotId: plot.id,
      title: c.title,
      type: c.type,
      plannedDate: c.date,
      date: ov.date ?? c.date,
      stageId: stage?.template.id,
      stageName: stage?.template.name,
      note: ov.note ?? c.note,
      custom: true,
      done: !!ov.done,
      skipped: !!ov.skipped,
      rescheduled: false,
    })
  }

  return tasks.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title))
}

export function stageAt(stages: StageInstance[], date: string): StageInstance | undefined {
  return stages.find((s) => date >= s.start && date <= s.end)
}

export type PlotStatus =
  | { kind: 'upcoming'; daysUntil: number }
  | { kind: 'active'; stage: StageInstance; dayInStage: number; progress: number }
  | { kind: 'finished'; daysAgo: number }

export function plotStatus(stages: StageInstance[], ref = today()): PlotStatus {
  const first = stages[0]
  const last = stages.at(-1)
  if (!first || !last) return { kind: 'finished', daysAgo: 0 }
  if (ref < first.start) return { kind: 'upcoming', daysUntil: diffDays(first.start, ref) }
  if (ref > last.end) return { kind: 'finished', daysAgo: diffDays(ref, last.end) }
  const stage = stageAt(stages, ref)!
  const dayInStage = diffDays(ref, stage.start) + 1
  return { kind: 'active', stage, dayInStage, progress: dayInStage / stage.days }
}

/** Overall cycle progress in [0, 1]. */
export function cycleProgress(stages: StageInstance[], ref = today()): number {
  const first = stages[0]
  const last = stages.at(-1)
  if (!first || !last) return 0
  const total = diffDays(last.end, first.start) + 1
  return Math.min(1, Math.max(0, (diffDays(ref, first.start) + 1) / total))
}

export function isOpen(t: TaskOccurrence): boolean {
  return !t.done && !t.skipped
}

export function isOverdue(t: TaskOccurrence, ref = today()): boolean {
  return isOpen(t) && t.date < ref
}
