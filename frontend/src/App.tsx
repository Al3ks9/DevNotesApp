import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Layout, { useSidebar } from './components/Layout/Layout'
import SearchModal from './components/SearchModal/SearchModal'
import NotesPage from './pages/NotesPage/NotesPage'
import NoteEditorPage from './pages/NoteEditorPage/NoteEditorPage'
import TagsPage from './pages/TagsPage/TagsPage'
import ImportPage from './pages/ImportPage/ImportPage'

function AppShell() {
  const navigate = useNavigate()
  const { toggleSidebar } = useSidebar()
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      const isEditor = (e.target as HTMLElement).closest?.('.ProseMirror') !== null

      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'b' && !isEditor) {
        e.preventDefault()
        toggleSidebar()
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'n' && tag !== 'INPUT' && tag !== 'TEXTAREA' && !isEditor) {
        e.preventDefault()
        navigate('/notes/new')
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [navigate, toggleSidebar])

  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/notes" replace />} />
          <Route path="notes" element={<NotesPage />} />
          <Route path="notes/new" element={<NoteEditorPage />} />
          <Route path="notes/:id" element={<NoteEditorPage />} />
          <Route path="tags" element={<TagsPage />} />
          <Route path="import" element={<ImportPage />} />
        </Route>
      </Routes>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}
