import { useState, useRef, useEffect } from 'react'
import { listTags, createTag } from '../../api/tags'
import type { Tag } from '../../api/types'
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
    setLoading(true)
    try {
      const tag = await createTag(input.trim())
      setAllTags(prev => [...prev, tag])
      onAdd(tag)
      setInput('')
      setOpen(false)
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
      else if (input.trim() && !exactMatch) handleCreate()
    }
  }

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.chips}>
        {selectedTags.map(tag => (
          <span key={tag.id} className={styles.chip}>
            #{tag.name}
            <button className={styles.removeBtn} onClick={() => onRemove(tag.id)} aria-label={`Remove ${tag.name}`}>✕</button>
          </span>
        ))}
        <input
          className={styles.input}
          value={input}
          placeholder={selectedTags.length === 0 ? placeholder : ''}
          onFocus={() => setOpen(true)}
          onChange={e => { setInput(e.target.value); setOpen(true) }}
          onKeyDown={handleKeyDown}
        />
      </div>

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
