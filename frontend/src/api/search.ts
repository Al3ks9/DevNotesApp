import { apiFetch } from './client'
import type { PaginatedResponse, SearchResult } from './types'

export function search(q: string): Promise<PaginatedResponse<SearchResult>> {
  return apiFetch(`/search?q=${encodeURIComponent(q)}`)
}
