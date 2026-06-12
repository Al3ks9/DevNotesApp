import { useNavigate, NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { listNotes } from '../../api/notes'
import { listTags } from '../../api/tags'
import type { NoteList, Tag } from '../../api/types'
import styles from './Sidebar.module.css'

interface Props {
  open: boolean
  onToggle: () => void
}

const navClassName = ({ isActive }: { isActive: boolean }) =>
  isActive ? styles.navLinkActive : styles.navLink

export default function Sidebar({ open, onToggle }: Props) {
  const navigate = useNavigate()
  const [recentNotes, setRecentNotes] = useState<NoteList[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      listNotes(1, 5).then(r => setRecentNotes(r?.items ?? [])),
      listTags().then(result => setTags(result ?? [])),
    ]).catch(() => setError('Failed to load sidebar data'))
    return () => controller.abort()
  }, [])

  if (!open) {
    return (
      <div className={styles.collapsed}>
        <button className={styles.toggleBtn} onClick={onToggle} title="Expand sidebar">›</button>
      </div>
    )
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <span className={styles.appName}>DevNotes</span>
        <button className={styles.toggleBtn} onClick={onToggle} title="Collapse sidebar">‹</button>
      </div>

      <button className={styles.newNoteBtn} onClick={() => navigate('/notes/new')}>
        + New Note
      </button>

      {error && <div className={styles.error}>{error}</div>}

      <nav className={styles.nav}>
        <NavLink to="/notes" className={navClassName}>
          NOTES
        </NavLink>
        <NavLink to="/tags" className={navClassName}>
          TAGS
        </NavLink>
        <NavLink to="/import" className={navClassName}>
          IMPORT
        </NavLink>
      </nav>

      {tags.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionTitle}>Tags</div>
          <ul className={styles.tagList}>
            {tags.slice(0, 10).map(tag => (
              <li key={tag.id}>
                <button className={styles.tagItem} onClick={() => navigate(`/notes?tag=${encodeURIComponent(tag.name)}`)}>
                  #{tag.name}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {recentNotes.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionTitle}>Recent Notes</div>
          <ul className={styles.tagList}>
            {recentNotes.map(note => (
              <li key={note.id}>
                <button className={styles.recentNote} onClick={() => navigate(`/notes/${note.id}`)}>
                  {note.title || 'Untitled'}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={`${styles.section} ${styles.disabled}`}>
        <div className={styles.sectionTitle}>AI Workspace</div>
        <span className={styles.comingSoon}>Coming soon</span>
      </section>
    </aside>
  )
}
