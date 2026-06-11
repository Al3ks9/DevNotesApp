import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { search } from '../../api/search'
import type { SearchResult } from '../../api/types'
import Modal from '../Modal/Modal'
import TagChip from '../TagChip/TagChip'
import styles from './SearchModal.module.css'

interface Props {
  open: boolean
  onClose: () => void
}

export default function SearchModal({ open, onClose }: Props) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setSelectedIdx(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setLoading(true)
      search(query)
        .then(r => { setResults(r.items); setSelectedIdx(0) })
        .catch(() => {})
        .finally(() => setLoading(false))
    }, 250)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIdx(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIdx]) {
      openResult(results[selectedIdx])
    }
  }

  function openResult(result: SearchResult) {
    navigate(`/notes/${result.id}`)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} ariaLabel="Search notes">
      <div className={styles.searchBox}>
        <input
          ref={inputRef}
          className={styles.input}
          placeholder="Search notes..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
      {loading && <div className={styles.status}>Searching…</div>}
      {!loading && query && results.length === 0 && (
        <div className={styles.status}>No results for "{query}"</div>
      )}
      {results.length > 0 && (
        <ul className={styles.results}>
          {results.map((r, i) => (
            <li
              key={r.id}
              className={i === selectedIdx ? styles.resultActive : styles.result}
              onMouseDown={() => openResult(r)}
            >
              <div className={styles.resultTitle}>{r.title || 'Untitled'}</div>
              {r.content && (
                <div className={styles.snippet}>{r.content.slice(0, 150)}</div>
              )}
              {r.tags.length > 0 && (
                <div className={styles.tags}>
                  {r.tags.map(t => <TagChip key={t.id} name={t.name} />)}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
