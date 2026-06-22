import { Trash2 } from 'lucide-react'
import type { NoteList } from '../../api/types'
import TagChip from '../TagChip/TagChip'
import styles from './NoteCard.module.css'

interface Props {
  note: NoteList
  variant?: 'list' | 'grid'
  onClick?: () => void
  onDelete?: (id: string) => void
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function NoteCard({ note, variant = 'list', onClick, onDelete }: Props) {
  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    onDelete?.(note.id)
  }

  const deleteButton = onDelete ? (
    <button
      type="button"
      className={styles.deleteBtn}
      onClick={handleDelete}
      title="Delete note"
      aria-label={`Delete ${note.title || 'Untitled'}`}
    >
      <Trash2 size={15} aria-hidden="true" />
    </button>
  ) : null

  if (variant === 'grid') {
    return (
      <div className={`${styles.card} ${styles.grid}`} onClick={onClick}>
        {deleteButton}
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
      {deleteButton}
      <div className={styles.titleRow}>
        <span className={styles.title}>{note.title || 'Untitled'}</span>
        <span className={styles.timestamp}>{formatDate(note.updated_at)}</span>
      </div>
      <div className={styles.tags}>
        {note.tags.map(t => <TagChip key={t.id} name={t.name} />)}
      </div>
    </div>
  )
}
