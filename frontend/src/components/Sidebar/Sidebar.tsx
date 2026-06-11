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

export default function Sidebar({ open, onToggle }: Props) {
  const navigate = useNavigate()
  const [recentNotes, setRecentNotes] = useState<NoteList[]>([])
  const [tags, setTags] = useState<Tag[]>([])

  useEffect(() => {
    listNotes(1, 5).then(r => setRecentNotes(r.items)).catch(() => {})
    listTags().then(setTags).catch(() => {})
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

      <nav className={styles.nav}>
        <NavLink to="/notes" className={({ isActive }) => isActive ? styles.navLinkActive : styles.navLink}>
          NOTES
        </NavLink>
        <NavLink to="/tags" className={({ isActive }) => isActive ? styles.navLinkActive : styles.navLink}>
          TAGS
        </NavLink>
        <NavLink to="/import" className={({ isActive }) => isActive ? styles.navLinkActive : styles.navLink}>
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
          <ul>
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
