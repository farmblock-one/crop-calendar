import { TASK_TYPES } from '../data/crops'
import type { TaskOccurrence } from '../types'

function esc(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1')
}

/**
 * Builds an iCalendar file of all-day events with a reminder at 6:00 the same morning,
 * so the schedule can be imported into Google Calendar / phone calendars for reminders.
 */
export function buildICS(calendarName: string, tasks: (TaskOccurrence & { plotName: string })[]): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FarmBlock//Crop Calendar//VI',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${esc(calendarName)}`,
  ]
  for (const t of tasks) {
    const day = t.date.replace(/-/g, '')
    const type = TASK_TYPES[t.type]
    lines.push(
      'BEGIN:VEVENT',
      `UID:${t.plotId}-${t.key.replace(/[^\w-]/g, '_')}@crop-calendar`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${day}`,
      `SUMMARY:${esc(`${type.icon} ${t.title} · ${t.plotName}`)}`,
      `DESCRIPTION:${esc([type.label, t.stageName && `Giai đoạn: ${t.stageName}`, t.note].filter(Boolean).join('\n'))}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'TRIGGER:PT6H',
      `DESCRIPTION:${esc(t.title)}`,
      'END:VALARM',
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export function downloadFile(filename: string, content: string, mime = 'text/calendar;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type: mime }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
