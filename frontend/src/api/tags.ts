import { apiFetch } from './client'
import type { Tag, PaginatedResponse } from './types'

export function listTags(): Promise<PaginatedResponse<Tag>> {
  return apiFetch('/tags?per_page=100')
}

export function createTag(name: string): Promise<Tag> {
  return apiFetch('/tags', { method: 'POST', body: JSON.stringify({ name }) })
}
