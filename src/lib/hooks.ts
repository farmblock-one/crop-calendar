import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../store'
import type { CropProfile, Plot, StageInstance, TaskOccurrence } from '../types'
import { buildStages, buildTasks } from './schedule'

export interface PlotSchedule {
  plot: Plot
  crop: CropProfile
  stages: StageInstance[]
  tasks: TaskOccurrence[]
}

export function useSchedules(): PlotSchedule[] {
  const { state } = useStore()
  return useMemo(() => {
    const out: PlotSchedule[] = []
    for (const plot of state.plots) {
      const crop = state.crops.find((c) => c.id === plot.cropId)
      if (!crop) continue
      const stages = buildStages(plot, crop)
      out.push({ plot, crop, stages, tasks: buildTasks(plot, crop, stages) })
    }
    return out
  }, [state])
}

export interface TaskWithPlot extends TaskOccurrence {
  plot: Plot
  crop: CropProfile
}

export function useAllTasks(): TaskWithPlot[] {
  const schedules = useSchedules()
  return useMemo(
    () =>
      schedules
        .flatMap((s) => s.tasks.map((t) => ({ ...t, plot: s.plot, crop: s.crop })))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [schedules],
  )
}

/** Minimal hash router: returns path segments of `#/a/b`. */
export function useRoute(): string[] {
  const read = () => window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const onChange = () => {
      setRoute(read())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

export function navigate(path: string) {
  window.location.hash = path.startsWith('/') ? path : `/${path}`
}
