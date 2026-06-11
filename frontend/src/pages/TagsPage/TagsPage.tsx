import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { listTags } from '../../api/tags'
import type { Tag } from '../../api/types'
import styles from './TagsPage.module.css'

type SortMode = 'count' | 'alpha'

export default function TagsPage() {
  const navigate = useNavigate()
  const [tags, setTags] = useState<Tag[]>([])
  const [filter, setFilter] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('count')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    listTags()
      .then(setTags)
      .catch(() => setError('Failed to load tags'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = tags
    .filter(t => t.name.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => {
      if (sortMode === 'alpha') return a.name.localeCompare(b.name)
      // sort by note count descending (Tag type has no count field currently, so fall back to alpha)
      return a.name.localeCompare(b.name)
    })

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <h1 className={styles.heading}>Tags</h1>
        <div className={styles.controls}>
          <input
            className={styles.filterInput}
            placeholder="Filter tags..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
          <div className={styles.sortToggle}>
            <button
              className={sortMode === 'count' ? styles.sortBtnActive : styles.sortBtn}
              onClick={() => setSortMode('count')}
            >By count</button>
            <button
              className={sortMode === 'alpha' ? styles.sortBtnActive : styles.sortBtn}
              onClick={() => setSortMode('alpha')}
            >A–Z</button>
          </div>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {loading && <div className={styles.loading}>Loading…</div>}

      {!loading && !error && filtered.length === 0 && (
        <div className={styles.empty}>No tags found.</div>
      )}

      <ul className={styles.tagList}>
        {filtered.map(tag => (
          <li key={tag.id} className={styles.tagRow} onClick={() => navigate(`/notes?tag=${encodeURIComponent(tag.name)}`)}>
            <span className={styles.tagName}>#{tag.name}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
