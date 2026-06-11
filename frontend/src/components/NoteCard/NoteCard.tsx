import type { NoteList } from '../../api/types'
import TagChip from '../TagChip/TagChip'
import styles from './NoteCard.module.css'

interface Props {
  note: NoteList
  variant?: 'list' | 'compact' | 'grid'
  onClick?: () => void
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}


export default function NoteCard({ note, variant = 'list', onClick }: Props) {
  if (variant === 'compact') {
    return (
      <div className={`${styles.card} ${styles.compact}`} onClick={onClick}>
        <div className={styles.compactRow}>
          <span className={styles.title}>{note.title || 'Untitled'}</span>
          <span className={styles.timestamp}>{formatDate(note.updated_at)}</span>
        </div>
        <div className={styles.tags}>
          {note.tags.map(t => <TagChip key={t.id} name={t.name} />)}
        </div>
      </div>
    )
  }

  if (variant === 'grid') {
    return (
      <div className={`${styles.card} ${styles.grid}`} onClick={onClick}>
        <div className={styles.title}>{note.title || 'Untitled'}</div>
        <div className={styles.tags}>
          {note.tags.map(t => <TagChip key={t.id} name={t.name} />)}
        </div>
      </div>
    )
  }

  // list (default)
  return (
    <div className={`${styles.card} ${styles.list}`} onClick={onClick}>
      <div className={styles.titleRow}>
        <span className={styles.title}>{note.title || 'Untitled'}</span>
        <span className={styles.timestamp}>{formatDate(note.updated_at)}</span>
      </div>
      <div className={styles.tags}>
        {note.tags.map(t => <TagChip key={t.id} name={t.name} />)}
      </div>
      {note.tags.length === 0 && <div className={styles.excerpt}></div>}
    </div>
  )
}
