import { useState, createContext, useContext, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../Sidebar/Sidebar'
import styles from './Layout.module.css'

export const SidebarContext = createContext<{
  sidebarOpen: boolean
  toggleSidebar: () => void
}>({ sidebarOpen: true, toggleSidebar: () => {} })

export function useSidebar() {
  return useContext(SidebarContext)
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const toggleSidebar = useCallback(() => setSidebarOpen(v => !v), [])

  return (
    <SidebarContext.Provider value={{ sidebarOpen, toggleSidebar }}>
      <div className={styles.shell}>
        <Sidebar open={sidebarOpen} onToggle={toggleSidebar} />
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </SidebarContext.Provider>
  )
}
