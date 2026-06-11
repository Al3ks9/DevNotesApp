import { useEffect, useRef } from 'react'
import styles from './Modal.module.css'

interface Props {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  ariaLabel?: string
}

export default function Modal({ open, onClose, children, ariaLabel }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      dialogRef.current?.focus()
    }
  }, [open])

  if (!open) return null

  return (
    <div className={styles.backdrop} onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={styles.dialog} ref={dialogRef} role="dialog" aria-modal="true" tabIndex={-1} aria-label={ariaLabel}>
        {children}
      </div>
    </div>
  )
}
