import { useNavigate, NavLink } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { FileText, Hash, Upload, History, PanelLeft, Plus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { listNotes } from '../../api/notes'
import { listTags } from '../../api/tags'
import type { NoteList, Tag } from '../../api/types'
import styles from './Sidebar.module.css'

interface Props {
  isPinned: boolean
  onTogglePin: () => void
}

interface NavItem {
  to: string
  label: string
  Icon: LucideIcon
}

const NAV_ITEMS: NavItem[] = [
  { to: '/notes', label: 'Notes', Icon: FileText },
  { to: '/tags', label: 'Tags', Icon: Hash },
  { to: '/import', label: 'Import', Icon: Upload },
]

// Delay before collapsing on mouse-out, to avoid flicker when the pointer
// briefly crosses a gap or moves between child elements.
const COLLAPSE_DELAY_MS = 180

const navClassName = ({ isActive }: { isActive: boolean }) =>
  isActive ? styles.navLinkActive : styles.navLink

export default function Sidebar({ isPinned, onTogglePin }: Props) {
  const navigate = useNavigate()
  const [recentNotes, setRecentNotes] = useState<NoteList[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [error, setError] = useState<string | null>(null)
  const [hoverOpen, setHoverOpen] = useState(false)
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      listNotes(1, 5).then(r => setRecentNotes(r?.items ?? [])),
      listTags().then(result => setTags(result ?? [])),
    ]).catch(() => setError('Failed to load sidebar data'))
    return () => controller.abort()
  }, [])

  useEffect(() => {
    return () => {
      if (collapseTimer.current) clearTimeout(collapseTimer.current)
    }
  }, [])

  // Hover handlers only matter in unpinned mode; in pinned mode they're not
  // attached so hovering has no effect.
  function handleMouseEnter() {
    if (collapseTimer.current) clearTimeout(collapseTimer.current)
    setHoverOpen(true)
  }

  function handleMouseLeave() {
    if (collapseTimer.current) clearTimeout(collapseTimer.current)
    collapseTimer.current = setTimeout(() => setHoverOpen(false), COLLAPSE_DELAY_MS)
  }

  const pinButton = (
    <button
      type="button"
      className={styles.pinBtn}
      onClick={onTogglePin}
      aria-label={isPinned ? 'Unpin sidebar (hover mode)' : 'Pin sidebar open'}
      aria-pressed={isPinned}
      title={isPinned ? 'Unpin sidebar' : 'Pin sidebar open'}
    >
      <PanelLeft size={18} aria-hidden="true" />
    </button>
  )

  const panel = (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.appName}>DevNotes</span>
        {pinButton}
      </div>

      <button className={styles.newNoteBtn} onClick={() => navigate('/notes/new')}>
        <Plus size={16} aria-hidden="true" />
        New Note
      </button>

      {error && <div className={styles.error}>{error}</div>}

      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} className={navClassName}>
            <Icon size={16} aria-hidden="true" className={styles.navIcon} />
            {label}
          </NavLink>
        ))}
      </nav>

      {tags.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionTitle}>
            <Hash size={16} aria-hidden="true" className={styles.sectionIcon} />
            Tags
          </div>
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
          <div className={styles.sectionTitle}>
            <History size={16} aria-hidden="true" className={styles.sectionIcon} />
            Recent Notes
          </div>
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
    </div>
  )

  // Pinned: the full panel sits permanently in the layout flow.
  if (isPinned) {
    return <aside className={`${styles.sidebar} ${styles.pinned}`}>{panel}</aside>
  }

  // Unpinned (hover mode): a slim icon strip reserves space; when hovered the
  // full panel overlays on top so page content doesn't shift.
  return (
    <aside
      className={styles.sidebar}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={styles.strip}>
        {pinButton}
        <button
          type="button"
          className={styles.stripBtn}
          onClick={() => navigate('/notes/new')}
          title="New Note"
          aria-label="New Note"
        >
          <Plus size={18} aria-hidden="true" />
        </button>
        <div className={styles.stripDivider} aria-hidden="true" />
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => (isActive ? styles.stripBtnActive : styles.stripBtn)}
            title={label}
            aria-label={label}
          >
            <Icon size={18} aria-hidden="true" />
          </NavLink>
        ))}
        <button
          type="button"
          className={styles.stripBtn}
          onClick={() => navigate('/notes')}
          title="Recent Notes"
          aria-label="Recent Notes"
        >
          <History size={18} aria-hidden="true" />
        </button>
      </div>

      {hoverOpen && <div className={styles.overlay}>{panel}</div>}
    </aside>
  )
}
