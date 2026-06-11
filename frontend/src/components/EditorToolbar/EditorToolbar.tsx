import { memo } from 'react'
import type { Editor } from '@tiptap/react'
import styles from './EditorToolbar.module.css'

interface Props {
  editor: Editor | null
}

interface BtnDef {
  label: string
  title: string
  run: () => void
  isActive?: () => boolean
}

export default memo(function EditorToolbar({ editor }: Props) {
  if (!editor) return null

  const buttons: BtnDef[] = [
    { label: 'B', title: 'Bold', run: () => editor.chain().focus().toggleBold().run(), isActive: () => editor.isActive('bold') },
    { label: 'I', title: 'Italic', run: () => editor.chain().focus().toggleItalic().run(), isActive: () => editor.isActive('italic') },
    { label: 'S', title: 'Strikethrough', run: () => editor.chain().focus().toggleStrike().run(), isActive: () => editor.isActive('strike') },
    { label: '</>', title: 'Inline code', run: () => editor.chain().focus().toggleCode().run(), isActive: () => editor.isActive('code') },
    { label: 'H1', title: 'Heading 1', run: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), isActive: () => editor.isActive('heading', { level: 1 }) },
    { label: 'H2', title: 'Heading 2', run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), isActive: () => editor.isActive('heading', { level: 2 }) },
    { label: 'H3', title: 'Heading 3', run: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), isActive: () => editor.isActive('heading', { level: 3 }) },
    { label: '• List', title: 'Bullet list', run: () => editor.chain().focus().toggleBulletList().run(), isActive: () => editor.isActive('bulletList') },
    { label: '1. List', title: 'Ordered list', run: () => editor.chain().focus().toggleOrderedList().run(), isActive: () => editor.isActive('orderedList') },
    { label: '❝', title: 'Blockquote', run: () => editor.chain().focus().toggleBlockquote().run(), isActive: () => editor.isActive('blockquote') },
    { label: '{ }', title: 'Code block', run: () => editor.chain().focus().toggleCodeBlock().run(), isActive: () => editor.isActive('codeBlock') },
    { label: 'HL', title: 'Highlight', run: () => editor.chain().focus().toggleHighlight().run(), isActive: () => editor.isActive('highlight') },
  ]

  return (
    <div className={styles.toolbar} role="toolbar" aria-label="Formatting">
      {buttons.map(btn => (
        <button
          key={btn.title}
          type="button"
          title={btn.title}
          aria-label={btn.title}
          aria-pressed={btn.isActive ? btn.isActive() : undefined}
          className={btn.isActive && btn.isActive() ? styles.btnActive : styles.btn}
          onClick={btn.run}
        >
          {btn.label}
        </button>
      ))}
      <span className={styles.divider} aria-hidden="true">|</span>
      <button
        type="button"
        title="Undo"
        aria-label="Undo"
        className={styles.btn}
        onClick={() => editor.chain().focus().undo().run()}
      >
        ↶
      </button>
      <button
        type="button"
        title="Redo"
        aria-label="Redo"
        className={styles.btn}
        onClick={() => editor.chain().focus().redo().run()}
      >
        ↷
      </button>
    </div>
  )
})
