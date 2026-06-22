import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import type { Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Highlight from '@tiptap/extension-highlight'
import Typography from '@tiptap/extension-typography'
import CharacterCount from '@tiptap/extension-character-count'
import { Markdown } from 'tiptap-markdown'
import { Trash2 } from 'lucide-react'
import { getNote, createNote, updateNote, deleteNote, addTag, removeTag } from '../../api/notes'
import type { NoteType, Tag } from '../../api/types'
import TagPicker from '../../components/TagPicker/TagPicker'
import EditorToolbar from '../../components/EditorToolbar/EditorToolbar'
import styles from './NoteEditorPage.module.css'

// In this project NoteType is 'note' | 'snippet' | 'document'.
// 'note' is treated as markdown; 'snippet' is treated as plain text.
const MARKDOWN_TYPE: NoteType = 'note'
const PLAIN_TYPE: NoteType = 'snippet'

type EditorMode = 'write' | 'preview' | 'split'
type SaveStatus = 'idle' | 'saving' | 'saved'

function getMarkdownFromEditor(editor: Editor): string {
  const storage = editor.storage as { markdown?: { getMarkdown(): string } }
  return storage.markdown?.getMarkdown() ?? ''
}

export default function NoteEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [noteId, setNoteId] = useState<string | null>(id ?? null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [noteType, setNoteType] = useState<NoteType>(MARKDOWN_TYPE)
  const [tags, setTags] = useState<Tag[]>([])
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [editorMode, setEditorMode] = useState<EditorMode>('write')
  const [outlineOpen, setOutlineOpen] = useState(false)
  const [lastModified, setLastModified] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Refs mirror state so the keydown/save closures always see the latest values.
  const titleRef = useRef(title)
  const contentRef = useRef(content)
  const noteTypeRef = useRef(noteType)
  const noteIdRef = useRef(noteId)
  const tagsRef = useRef<Tag[]>(tags)
  const isSavingRef = useRef(false)
  const isHydratingRef = useRef(false)
  useEffect(() => {
    titleRef.current = title
    contentRef.current = content
    noteTypeRef.current = noteType
    noteIdRef.current = noteId
  }, [title, content, noteType, noteId])
  useEffect(() => {
    tagsRef.current = tags
  }, [tags])

  const isMarkdown = noteType === MARKDOWN_TYPE

  const doSave = useCallback(async () => {
    if (isSavingRef.current) return
    const curTitle = titleRef.current
    const curContent = contentRef.current
    if (!curTitle.trim() && !curContent.trim()) return // don't save empty notes
    isSavingRef.current = true
    setSaveStatus('saving')
    try {
      if (noteIdRef.current) {
        const updated = await updateNote(noteIdRef.current, {
          title: curTitle,
          content: curContent,
          note_type: noteTypeRef.current,
        })
        setLastModified(updated.updated_at)
      } else {
        const created = await createNote({
          title: curTitle,
          content: curContent,
          note_type: noteTypeRef.current,
        })
        setNoteId(created.id)
        noteIdRef.current = created.id
        setLastModified(created.updated_at)
        // Sync any tags added before the note existed.
        for (const tag of tagsRef.current) {
          try {
            await addTag(created.id, tag.id)
          } catch {
            /* ignore individual tag sync failures */
          }
        }
        // Update URL without navigation (avoids remount of this component).
        window.history.replaceState({}, '', `/notes/${created.id}`)
      }
      setSaveStatus('saved')
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current)
      statusTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000)
    } catch {
      setSaveStatus('idle')
    } finally {
      isSavingRef.current = false
    }
  }, [])

  const scheduleSave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      void doSave()
    }, 1500)
  }, [doSave])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Start writing...' }),
      Link.configure({ openOnClick: false }),
      Highlight,
      Typography,
      CharacterCount,
      Markdown,
    ],
    content: '',
    onUpdate: ({ editor }) => {
      if (isHydratingRef.current) return
      const md = getMarkdownFromEditor(editor)
      setContent(md)
      contentRef.current = md
      scheduleSave()
    },
  })

  // Load an existing note.
  useEffect(() => {
    if (!id) return
    let cancelled = false
    getNote(id)
      .then(note => {
        if (cancelled) return
        setNoteId(note.id)
        setTitle(note.title)
        setContent(note.content)
        setNoteType(note.note_type)
        setTags(note.tags)
        setLastModified(note.updated_at)
      })
      .catch(() => {
        if (!cancelled) setLoadError('Failed to load note')
      })
    return () => {
      cancelled = true
    }
  }, [id])

  // Push loaded content into the editor once both are ready.
  const hydratedRef = useRef(false)
  // Reset hydration flag when navigating between notes so the new note hydrates.
  useEffect(() => {
    hydratedRef.current = false
  }, [id])
  useEffect(() => {
    if (!editor || hydratedRef.current) return
    if (!isMarkdown) {
      hydratedRef.current = true // plain-text notes don't hydrate into TipTap
      return
    }
    if (!id) {
      hydratedRef.current = true
      return
    }
    if (content) {
      isHydratingRef.current = true
      editor.commands.setContent(content)
      isHydratingRef.current = false
      hydratedRef.current = true
    }
  }, [editor, id, content, isMarkdown])

  // Ctrl/Cmd+S to save immediately.
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
        void doSave()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [doSave])

  // Cleanup timers on unmount.
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current)
    }
  }, [])

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTitle(e.target.value)
    titleRef.current = e.target.value
    scheduleSave()
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(e.target.value)
    contentRef.current = e.target.value
    scheduleSave()
  }

  function toggleNoteType() {
    const next = isMarkdown ? PLAIN_TYPE : MARKDOWN_TYPE
    setNoteType(next)
    noteTypeRef.current = next
    if (next === MARKDOWN_TYPE && editor) {
      // Re-render markdown content into the editor when switching back.
      hydratedRef.current = true
      editor.commands.setContent(contentRef.current)
    }
    scheduleSave()
  }

  async function handleAddTag(tag: Tag) {
    if (tags.some(t => t.id === tag.id)) return
    setTags(prev => [...prev, tag])
    if (noteIdRef.current) {
      try {
        await addTag(noteIdRef.current, tag.id)
      } catch {
        setTags(prev => prev.filter(t => t.id !== tag.id))
      }
    }
  }

  async function handleRemoveTag(tagId: string) {
    const prevTags = tags
    setTags(prev => prev.filter(t => t.id !== tagId))
    if (noteIdRef.current) {
      try {
        await removeTag(noteIdRef.current, tagId)
      } catch {
        setTags(prevTags)
      }
    }
  }

  async function handleDelete() {
    const currentId = noteIdRef.current
    // Nothing persisted yet — just go back to the list.
    if (!currentId) {
      navigate('/notes')
      return
    }
    if (!window.confirm('Delete this note? This cannot be undone.')) return
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    try {
      await deleteNote(currentId)
      navigate('/notes')
    } catch {
      setLoadError('Failed to delete note')
    }
  }

  const saveLabel =
    saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : ''

  const showToolbar = isMarkdown && (editorMode === 'write' || editorMode === 'split')
  const showEditor = isMarkdown && (editorMode === 'write' || editorMode === 'split')
  const showPreview = isMarkdown && (editorMode === 'preview' || editorMode === 'split')

  return (
    <div className={styles.page}>
      <input
        className={styles.titleInput}
        value={title}
        onChange={handleTitleChange}
        placeholder="Untitled"
        aria-label="Note title"
      />

      <div className={styles.metaBar}>
        <div className={styles.metaLeft}>
          <TagPicker selectedTags={tags} onAdd={handleAddTag} onRemove={handleRemoveTag} />
        </div>
        <div className={styles.metaRight}>
          <button
            type="button"
            className={styles.typeToggle}
            onClick={toggleNoteType}
            title="Toggle note type"
          >
            {isMarkdown ? 'Markdown' : 'Plain Text'}
          </button>

          {isMarkdown && (
            <div className={styles.modeToggle}>
              {(['write', 'preview', 'split'] as EditorMode[]).map(mode => (
                <button
                  key={mode}
                  type="button"
                  className={editorMode === mode ? styles.modeBtnActive : styles.modeBtn}
                  onClick={() => setEditorMode(mode)}
                >
                  {mode}
                </button>
              ))}
            </div>
          )}

          {lastModified && (
            <span className={styles.timestamp} title="Last modified">
              {new Date(lastModified).toLocaleString()}
            </span>
          )}

          {saveLabel && <span className={styles.saveStatus}>{saveLabel}</span>}

          {isMarkdown && (
            <button
              type="button"
              className={styles.outlineBtn}
              onClick={() => setOutlineOpen(o => !o)}
            >
              Outline
            </button>
          )}

          <button
            type="button"
            className={styles.deleteBtn}
            onClick={handleDelete}
            title="Delete note"
            aria-label="Delete note"
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      {loadError && <div className={styles.error}>{loadError}</div>}

      {showToolbar && <EditorToolbar editor={editor} />}

      <div className={`${styles.editorArea} ${editorMode === 'split' && isMarkdown ? styles.split : ''}`}>
        {!isMarkdown && (
          <textarea
            className={styles.plainTextarea}
            value={content}
            onChange={handleTextareaChange}
            placeholder="Start writing..."
            aria-label="Note content"
          />
        )}

        {showEditor && (
          <div className={styles.editorPane}>
            <EditorContent editor={editor} className={styles.tiptap} />
          </div>
        )}

        {showPreview && (
          <div
            className={styles.previewPane}
            dangerouslySetInnerHTML={{ __html: editor?.getHTML() ?? '' }}
          />
        )}

        {outlineOpen && isMarkdown && (
          <OutlinePanel editor={editor} onClose={() => setOutlineOpen(false)} />
        )}
      </div>
    </div>
  )
}

function OutlinePanel({ editor, onClose }: { editor: Editor | null; onClose: () => void }) {
  const headings: { level: number; text: string; pos: number }[] = []
  editor?.state.doc.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      headings.push({ level: node.attrs.level as number, text: node.textContent, pos })
    }
  })

  function goTo(pos: number) {
    if (!editor) return
    editor.chain().focus().setTextSelection(pos + 1).run()
    const dom = editor.view.domAtPos(pos + 1)
    const el = dom.node instanceof HTMLElement ? dom.node : dom.node.parentElement
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div className={styles.outlinePanel} role="dialog" aria-label="Outline">
      <div className={styles.outlineHeader}>
        <span>Outline</span>
        <button type="button" className={styles.outlineClose} onClick={onClose} aria-label="Close outline">
          ✕
        </button>
      </div>
      {headings.length === 0 ? (
        <div className={styles.outlineEmpty}>No headings</div>
      ) : (
        <ul className={styles.outlineList}>
          {headings.map(h => (
            <li key={h.pos} style={{ paddingLeft: `${(h.level - 1) * 12}px` }}>
              <button type="button" className={styles.outlineItem} onClick={() => goTo(h.pos)}>
                {h.text || '(untitled heading)'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
