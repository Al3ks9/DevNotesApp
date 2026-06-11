import { apiFetch } from './client'
import type { Note, NoteList, NoteCreate, NoteUpdate, PaginatedResponse } from './types'

export type { NoteCreate, NoteUpdate }

export function listNotes(page = 1, perPage = 20, tag?: string): Promise<PaginatedResponse<NoteList>> {
  const params = new URLSearchParams({ page: String(page), per_page: String(perPage) })
  if (tag) params.set('tag', tag)
  return apiFetch(`/notes?${params}`)
}

export function getNote(id: string): Promise<Note> {
  return apiFetch(`/notes/${id}`)
}

export function createNote(data: NoteCreate): Promise<Note> {
  return apiFetch('/notes', { method: 'POST', body: JSON.stringify(data) })
}

export function updateNote(id: string, data: NoteUpdate): Promise<Note> {
  return apiFetch(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

export function deleteNote(id: string): Promise<void> {
  return apiFetch(`/notes/${id}`, { method: 'DELETE' })
}

export function addTag(noteId: string, tagId: string): Promise<Note> {
  return apiFetch(`/notes/${noteId}/tags`, { method: 'POST', body: JSON.stringify({ tag_ids: [tagId] }) })
}

export function removeTag(noteId: string, tagId: string): Promise<void> {
  return apiFetch(`/notes/${noteId}/tags/${tagId}`, { method: 'DELETE' })
}
