export type NoteType = 'note' | 'snippet' | 'document'

export interface Tag {
  id: string
  name: string
}

export interface NoteList {
  id: string
  title: string
  note_type: NoteType
  created_at: string
  updated_at: string
  tags: Tag[]
}

export interface Note {
  id: string
  title: string
  content: string
  source_path: string | null
  note_type: NoteType
  created_at: string
  updated_at: string
  tags: Tag[]
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
}

export interface ImportResult {
  created: number
  skipped: number
  errors: string[]
}

export interface SearchResult {
  id: string
  title: string
  content: string
  tags: Tag[]
}

export interface NoteCreate {
  title: string
  content: string
  source_path?: string
  note_type?: NoteType
  tag_ids?: string[]
}

export interface NoteUpdate {
  title?: string
  content?: string
  source_path?: string
  note_type?: NoteType
  tag_ids?: string[]
}
