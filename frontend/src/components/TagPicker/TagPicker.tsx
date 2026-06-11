import { useState, useRef, useEffect } from 'react'
import { listTags, createTag } from '../../api/tags'
import type { Tag } from '../../api/types'
import TagChip from '../TagChip/TagChip'
import styles from './TagPicker.module.css'

interface Props {
  selectedTags: Tag[]
  onAdd: (tag: Tag) => void
  onRemove: (tagId: string) => void
  placeholder?: string
}

export default function TagPicker({ selectedTags, onAdd, onRemove, placeholder = 'Add tag...' }: Props) {
  const [input, setInput] = useState('')
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listTags().then(setAllTags).catch(() => {})
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setInput('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selectedIds = new Set(selectedTags.map(t => t.id))
  const filtered = allTags.filter(
    t => !selectedIds.has(t.id) && t.name.toLowerCase().includes(input.toLowerCase())
  )
  const exactMatch = allTags.some(t => t.name.toLowerCase() === input.toLowerCase())

  async function handleSelect(tag: Tag) {
    onAdd(tag)
    setInput('')
    setOpen(false)
  }

  async function handleCreate() {
    if (!input.trim()) return
    if (loading) return
    setLoading(true)
    try {
      const tag = await createTag(input.trim())
      setAllTags(prev => [...prev, tag])
      onAdd(tag)
      setInput('')
      setOpen(false)
    } catch {
      setError('Failed to create tag')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setOpen(false)
      setInput('')
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered.length > 0) handleSelect(filtered[0])
      else if (input.trim() && !exactMatch && !loading) handleCreate()
    }
  }

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.chips}>
        {selectedTags.map(tag => (
          <TagChip key={tag.id} name={tag.name} variant="removable" onRemove={() => onRemove(tag.id)} />
        ))}
        <input
          className={styles.input}
          value={input}
          placeholder={selectedTags.length === 0 ? placeholder : ''}
          onFocus={() => setOpen(true)}
          onChange={e => { setInput(e.target.value); setOpen(true); setError(null) }}
          onKeyDown={handleKeyDown}
        />
      </div>
      {error && <div className={styles.errorMsg}>{error}</div>}

      {open && (filtered.length > 0 || (input.trim() && !exactMatch)) && (
        <ul className={styles.dropdown}>
          {filtered.map(tag => (
            <li key={tag.id}>
              <button className={styles.option} onMouseDown={() => handleSelect(tag)}>
                #{tag.name}
              </button>
            </li>
          ))}
          {input.trim() && !exactMatch && (
            <li>
              <button className={styles.option} onMouseDown={handleCreate} disabled={loading}>
                {loading ? 'Creating...' : `Create #${input.trim()}`}
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
