import { apiFetch } from './client'
import type { Tag, PaginatedResponse } from './types'

export async function listTags(): Promise<Tag[]> {
  const res = await apiFetch<PaginatedResponse<Tag>>('/tags?per_page=100')
  return res.items
}

export function createTag(name: string): Promise<Tag> {
  return apiFetch('/tags', { method: 'POST', body: JSON.stringify({ name }) })
}
