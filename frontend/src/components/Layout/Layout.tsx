import { useState, createContext, useContext, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../Sidebar/Sidebar'
import styles from './Layout.module.css'

const PIN_STORAGE_KEY = 'devnotes.sidebar.pinned'

export const SidebarContext = createContext<{
  isPinned: boolean
  togglePin: () => void
}>({ isPinned: false, togglePin: () => {} })

export function useSidebar() {
  return useContext(SidebarContext)
}

export default function Layout() {
  // Default to hover mode (unpinned); restore the user's pin preference.
  const [isPinned, setIsPinned] = useState(
    () => localStorage.getItem(PIN_STORAGE_KEY) === 'true',
  )

  const togglePin = useCallback(() => {
    setIsPinned(prev => {
      const next = !prev
      localStorage.setItem(PIN_STORAGE_KEY, String(next))
      return next
    })
  }, [])

  return (
    <SidebarContext.Provider value={{ isPinned, togglePin }}>
      <div className={styles.shell}>
        <Sidebar isPinned={isPinned} onTogglePin={togglePin} />
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </SidebarContext.Provider>
  )
}
