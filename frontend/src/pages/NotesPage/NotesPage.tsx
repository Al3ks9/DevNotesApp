import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { listNotes, deleteNote } from '../../api/notes'
import type { NoteList } from '../../api/types'
import NoteCard from '../../components/NoteCard/NoteCard'
import styles from './NotesPage.module.css'

type ViewMode = 'list' | 'grid'
type SortField = 'updated_at' | 'created_at' | 'title'

const PER_PAGE = 20

export default function NotesPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTag = searchParams.get('tag') ?? undefined

  const [notes, setNotes] = useState<NoteList[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [sortField, setSortField] = useState<SortField>('updated_at')

  useEffect(() => {
    setPage(1)
  }, [activeTag, sortField])

  useEffect(() => {
    setLoading(true)
    setError(null)
    listNotes(page, PER_PAGE, activeTag)
      .then(r => {
        setNotes(r.items)
        setTotal(r.total)
      })
      .catch(() => setError('Failed to load notes'))
      .finally(() => setLoading(false))
  }, [page, activeTag, sortField])

  function clearTagFilter() {
    setSearchParams({})
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this note? This cannot be undone.')) return
    try {
      await deleteNote(id)
      setNotes(prev => prev.filter(n => n.id !== id))
      setTotal(t => Math.max(0, t - 1))
    } catch {
      setError('Failed to delete note')
    }
  }

  const totalPages = Math.ceil(total / PER_PAGE)

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <h1 className={styles.heading}>Notes</h1>
        <div className={styles.controls}>
          <div className={styles.viewToggle}>
            {(['list', 'grid'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                className={viewMode === mode ? styles.viewBtnActive : styles.viewBtn}
                onClick={() => setViewMode(mode)}
              >
                {mode}
              </button>
            ))}
          </div>
          <select
            className={styles.sortSelect}
            value={sortField}
            onChange={e => setSortField(e.target.value as SortField)}
          >
            <option value="updated_at">Last modified</option>
            <option value="created_at">Created</option>
            <option value="title">Title</option>
          </select>
        </div>
      </div>

      {activeTag && (
        <div className={styles.filterBar}>
          <span className={styles.filterChip}>#{activeTag} <button onClick={clearTagFilter}>✕</button></span>
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}

      {loading && notes.length === 0 && <div className={styles.loading}>Loading…</div>}

      {!loading && !error && notes.length === 0 && (
        <div className={styles.empty}>
          No notes yet. <button className={styles.emptyAction} onClick={() => navigate('/notes/new')}>Create your first note</button> or <button className={styles.emptyAction} onClick={() => navigate('/import')}>import files</button>.
        </div>
      )}

      <div className={viewMode === 'grid' ? styles.gridList : styles.noteList}>
        {notes.map(note => (
          <NoteCard
            key={note.id}
            note={note}
            variant={viewMode}
            onClick={() => navigate(`/notes/${note.id}`)}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span>{page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  )
}
