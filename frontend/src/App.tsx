import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import NotesPage from './pages/NotesPage/NotesPage'
import NoteEditorPage from './pages/NoteEditorPage/NoteEditorPage'
import TagsPage from './pages/TagsPage/TagsPage'
import ImportPage from './pages/ImportPage/ImportPage'

export default function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  )
}
