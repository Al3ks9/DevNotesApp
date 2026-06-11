import styles from './TagChip.module.css'

interface Props {
  name: string
  variant?: 'display' | 'removable'
  onRemove?: () => void
}

export default function TagChip({ name, variant = 'display', onRemove }: Props) {
  return (
    <span className={styles.chip}>
      #{name}
      {variant === 'removable' && (
        <button className={styles.removeBtn} onClick={onRemove} aria-label={`Remove tag ${name}`}>
          ✕
        </button>
      )}
    </span>
  )
}
