export type TaskType = 'water' | 'fertilize' | 'prune' | 'pest' | 'harvest' | 'other'

/** A task defined inside a stage of a crop profile. */
export interface TaskTemplate {
  id: string
  title: string
  type: TaskType
  /** Day offset from the start of the stage (0 = first day of the stage). */
  offsetDay: number
  /** Repeat every N days until the end of the stage. Omit for a one-off task. */
  repeatEvery?: number
  note?: string
}

export interface StageTemplate {
  id: string
  name: string
  days: number
  description: string
  color: string
  tasks: TaskTemplate[]
}

export interface CropProfile {
  id: string
  name: string
  emoji: string
  variety: string
  climate: string
  description: string
  /** Perennial crops follow a yearly cycle, "planting date" is the cycle start. */
  perennial: boolean
  stages: StageTemplate[]
  builtIn?: boolean
}

export interface OccurrenceOverride {
  /** Rescheduled date (ISO yyyy-mm-dd). */
  date?: string
  done?: boolean
  doneAt?: string
  skipped?: boolean
  note?: string
}

export interface CustomTask {
  id: string
  title: string
  type: TaskType
  date: string
  note?: string
}

export interface FieldLog {
  id: string
  date: string
  text: string
}

export interface Plot {
  id: string
  name: string
  cropId: string
  plantingDate: string
  area?: string
  location?: string
  /** Engineer adjustment of each stage length, in days (+ longer, − shorter). */
  stageAdjust: Record<string, number>
  overrides: Record<string, OccurrenceOverride>
  customTasks: CustomTask[]
  logs: FieldLog[]
  createdAt: string
}

export interface StageInstance {
  template: StageTemplate
  index: number
  start: string
  /** Inclusive last day of the stage. */
  end: string
  days: number
  adjust: number
}

export interface TaskOccurrence {
  /** Stable key used for overrides: `${taskId}#${n}` or `custom:${id}`. */
  key: string
  plotId: string
  title: string
  type: TaskType
  /** Originally generated date. */
  plannedDate: string
  /** Effective date after engineer adjustments. */
  date: string
  stageId?: string
  stageName?: string
  note?: string
  custom: boolean
  done: boolean
  skipped: boolean
  rescheduled: boolean
}
