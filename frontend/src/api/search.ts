import { apiFetch } from './client'
import type { PaginatedResponse, SearchResult } from './types'

export function search(q: string, page = 1, perPage = 20): Promise<PaginatedResponse<SearchResult>> {
  const params = new URLSearchParams({ q, page: String(page), per_page: String(perPage) })
  return apiFetch(`/search?${params}`)
}
