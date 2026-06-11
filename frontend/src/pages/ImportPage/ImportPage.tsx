import { useState } from 'react'
import { importFolder } from '../../api/imports'
import type { ImportResult } from '../../api/types'
import TagPicker from '../../components/TagPicker/TagPicker'
import type { Tag } from '../../api/types'
import styles from './ImportPage.module.css'

export default function ImportPage() {
  const [folderPath, setFolderPath] = useState('')
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [errorsExpanded, setErrorsExpanded] = useState(false)

  async function handleImport() {
    if (loading) return
    if (!folderPath.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await importFolder(folderPath.trim(), tags.map(t => t.name))
      setResult(res)
    } catch {
      setError('Import failed. Check the folder path and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <h1 className={styles.heading}>Import Notes</h1>
      </div>

      <div className={styles.form}>
        <label className={styles.label}>Folder path</label>
        <div className={styles.pathRow}>
          <input
            className={styles.pathInput}
            placeholder="/Users/you/notes"
            value={folderPath}
            onChange={e => setFolderPath(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleImport()}
          />
        </div>

        <label className={styles.label}>Tags to apply</label>
        <TagPicker
          selectedTags={tags}
          onAdd={tag => setTags(prev => prev.some(t => t.id === tag.id) ? prev : [...prev, tag])}
          onRemove={id => setTags(prev => prev.filter(t => t.id !== id))}
          placeholder="Add tags to apply to all imported notes..."
        />

        <button
          className={styles.importBtn}
          onClick={handleImport}
          disabled={loading || !folderPath.trim()}
        >
          {loading ? 'Importing…' : 'Import'}
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {result && (
        <div className={styles.results}>
          <div className={styles.resultsTitle}>Import complete</div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Imported</span>
            <span className={`${styles.statValue} ${styles.success}`}>{result.created}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Skipped</span>
            <span className={`${styles.statValue} ${styles.muted}`}>{result.skipped}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Errors</span>
            <span className={`${styles.statValue} ${result.errors.length > 0 ? styles.errorCount : styles.muted}`}>{result.errors.length}</span>
          </div>
          {result.errors.length > 0 && (
            <div>
              <button className={styles.expandBtn} onClick={() => setErrorsExpanded(v => !v)}>
                {errorsExpanded ? 'Hide errors ▴' : 'View errors ▾'}
              </button>
              {errorsExpanded && (
                <ul className={styles.errorList}>
                  {result.errors.map((e, i) => <li key={i} className={styles.errorItem}>{e}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
