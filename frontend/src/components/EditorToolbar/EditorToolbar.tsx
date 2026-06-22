import { memo, useEffect, useReducer } from 'react'
import type { Editor } from '@tiptap/react'
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Braces,
  Highlighter,
  Undo2,
  Redo2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import styles from './EditorToolbar.module.css'

interface Props {
  editor: Editor | null
}

interface BtnDef {
  Icon: LucideIcon
  title: string
  run: () => void
  isActive?: () => boolean
}

export default memo(function EditorToolbar({ editor }: Props) {
  // TipTap's editor instance is stable across renders, so the toolbar would not
  // re-evaluate isAct() as the cursor moves. Subscribe to editor updates and
  // force a re-render so active states stay in sync with the selection.
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0)
  useEffect(() => {
    if (!editor) return
    const update = () => forceUpdate()
    editor.on('transaction', update)
    editor.on('selectionUpdate', update)
    return () => {
      editor.off('transaction', update)
      editor.off('selectionUpdate', update)
    }
  }, [editor])

  if (!editor) return null

  const buttons: BtnDef[] = [
    { Icon: Bold, title: 'Bold', run: () => editor.chain().focus().toggleBold().run(), isActive: () => editor.isActive('bold') },
    { Icon: Italic, title: 'Italic', run: () => editor.chain().focus().toggleItalic().run(), isActive: () => editor.isActive('italic') },
    { Icon: Strikethrough, title: 'Strikethrough', run: () => editor.chain().focus().toggleStrike().run(), isActive: () => editor.isActive('strike') },
    { Icon: Code, title: 'Inline code', run: () => editor.chain().focus().toggleCode().run(), isActive: () => editor.isActive('code') },
    { Icon: Heading1, title: 'Heading 1', run: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), isActive: () => editor.isActive('heading', { level: 1 }) },
    { Icon: Heading2, title: 'Heading 2', run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), isActive: () => editor.isActive('heading', { level: 2 }) },
    { Icon: Heading3, title: 'Heading 3', run: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), isActive: () => editor.isActive('heading', { level: 3 }) },
    { Icon: List, title: 'Bullet list', run: () => editor.chain().focus().toggleBulletList().run(), isActive: () => editor.isActive('bulletList') },
    { Icon: ListOrdered, title: 'Ordered list', run: () => editor.chain().focus().toggleOrderedList().run(), isActive: () => editor.isActive('orderedList') },
    { Icon: Quote, title: 'Blockquote', run: () => editor.chain().focus().toggleBlockquote().run(), isActive: () => editor.isActive('blockquote') },
    { Icon: Braces, title: 'Code block', run: () => editor.chain().focus().toggleCodeBlock().run(), isActive: () => editor.isActive('codeBlock') },
    { Icon: Highlighter, title: 'Highlight', run: () => editor.chain().focus().toggleHighlight().run(), isActive: () => editor.isActive('highlight') },
  ]

  return (
    <div className={styles.toolbar} role="toolbar" aria-label="Formatting">
      {buttons.map(({ Icon, title, run, isActive }) => {
        const active = isActive ? isActive() : false
        return (
          <button
            key={title}
            type="button"
            title={title}
            aria-label={title}
            aria-pressed={isActive ? active : undefined}
            className={active ? styles.btnActive : styles.btn}
            onClick={run}
          >
            <Icon size={16} aria-hidden="true" />
          </button>
        )
      })}
      <span className={styles.divider} aria-hidden="true">|</span>
      <button
        type="button"
        title="Undo"
        aria-label="Undo"
        className={styles.btn}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2 size={16} aria-hidden="true" />
      </button>
      <button
        type="button"
        title="Redo"
        aria-label="Redo"
        className={styles.btn}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2 size={16} aria-hidden="true" />
      </button>
    </div>
  )
})
