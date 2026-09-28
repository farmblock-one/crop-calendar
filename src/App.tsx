import { useEffect, useState } from 'react'
import { today } from './lib/date'
import { useAllTasks, useRoute } from './lib/hooks'
import { isOpen, isOverdue } from './lib/schedule'
import { CalendarPage } from './pages/CalendarPage'
import { ChecklistPage } from './pages/ChecklistPage'
import { Dashboard } from './pages/Dashboard'
import { CropEditor, Library } from './pages/Library'
import { NewPlot } from './pages/NewPlot'
import { PlotDetail } from './pages/PlotDetail'
import { demoState, StoreProvider, useStore } from './store'

const NAV = [
  { path: '', label: 'Tổng quan', icon: '🏡' },
  { path: 'checklist', label: 'Checklist', icon: '✅' },
  { path: 'calendar', label: 'Lịch', icon: '📅' },
  { path: 'library', label: 'Quy trình', icon: '📚' },
]

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}

function Shell() {
  const route = useRoute()
  const [section, a, b] = route
  const tasks = useAllTasks()
  const t0 = today()
  const dueCount = tasks.filter((t) => isOpen(t) && t.date <= t0).length

  let page
  if (section === 'plots' && a === 'new') page = <NewPlot key={b ?? 'new'} cropId={b} />
  else if (section === 'plots' && a) page = <PlotDetail key={a} id={a} />
  else if (section === 'calendar') page = <CalendarPage />
  else if (section === 'checklist') page = <ChecklistPage />
  else if (section === 'library' && a) page = <CropEditor key={route.join('/')} id={a} from={b} />
  else if (section === 'library') page = <Library />
  else page = <Dashboard />

  const active = section === 'plots' ? '' : (section ?? '')

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="#/">
          <img src="./favicon.svg" alt="" width={28} height={28} />
          <span>
            Crop Calendar<small>FarmBlock</small>
          </span>
        </a>
        <nav className="nav">
          {NAV.map((n) => (
            <a key={n.path} href={`#/${n.path}`} className={active === n.path ? 'on' : ''}>
              <span aria-hidden>{n.icon}</span>
              <span>{n.label}</span>
              {n.path === 'checklist' && dueCount > 0 && <span className="nav-badge">{dueCount}</span>}
            </a>
          ))}
        </nav>
        <div className="topbar-actions">
          <Reminders />
          <DataMenu />
        </div>
      </header>
      <main>{page}</main>
    </div>
  )
}

const NOTIFY_KEY = 'crop-calendar/notified'

/** Browser notification once per day summarising today's and overdue tasks. */
function Reminders() {
  const tasks = useAllTasks()
  const supported = typeof Notification !== 'undefined'
  const [perm, setPerm] = useState(supported ? Notification.permission : 'denied')
  const t0 = today()
  const due = tasks.filter((t) => isOpen(t) && t.date === t0)
  const overdue = tasks.filter((t) => isOverdue(t))

  useEffect(() => {
    if (perm !== 'granted') return
    try {
      if (localStorage.getItem(NOTIFY_KEY) === t0) return
      localStorage.setItem(NOTIFY_KEY, t0)
    } catch {
      return
    }
    if (!due.length && !overdue.length) return
    const lines = due.slice(0, 4).map((t) => `• ${t.title} (${t.plot.name})`)
    new Notification(`Hôm nay có ${due.length} việc${overdue.length ? `, ${overdue.length} việc trễ hạn` : ''}`, {
      body: lines.join('\n') || 'Mở Crop Calendar để xem chi tiết.',
      icon: './favicon.svg',
      tag: 'crop-calendar-daily',
    })
  }, [perm, t0, due, overdue])

  if (!supported) return null
  const ask = async () => setPerm(await Notification.requestPermission())
  return (
    <button
      className={perm === 'granted' ? 'btn small on' : 'btn small'}
      onClick={perm === 'default' ? ask : undefined}
      title={
        perm === 'granted'
          ? 'Đã bật: nhắc việc mỗi ngày khi mở ứng dụng'
          : perm === 'denied'
            ? 'Trình duyệt đang chặn thông báo'
            : 'Bật thông báo nhắc việc hằng ngày'
      }
    >
      🔔 <span className="hide-sm">{perm === 'granted' ? 'Đã bật nhắc' : 'Bật nhắc việc'}</span>
    </button>
  )
}

function DataMenu() {
  const { state, dispatch } = useStore()
  const exportJSON = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `crop-calendar-${today()}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const importJSON = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const data = JSON.parse(await file.text())
        if (!Array.isArray(data.crops) || !Array.isArray(data.plots)) throw new Error('invalid')
        dispatch({ type: 'reset', state: data })
      } catch {
        alert('File không hợp lệ.')
      }
    }
    input.click()
  }
  return (
    <details className="menu">
      <summary className="btn small" aria-label="Dữ liệu">⋯</summary>
      <div className="menu-pop">
        <button onClick={exportJSON}>Sao lưu dữ liệu (.json)</button>
        <button onClick={importJSON}>Khôi phục từ file…</button>
        <button
          onClick={() => {
            if (confirm('Thay toàn bộ dữ liệu hiện tại bằng dữ liệu mẫu?')) dispatch({ type: 'reset', state: demoState() })
          }}
        >
          Nạp lại dữ liệu mẫu
        </button>
      </div>
    </details>
  )
}
