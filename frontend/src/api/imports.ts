import { apiFetch } from './client'
import type { ImportResult } from './types'

export function importFolder(path: string, tags: string[]): Promise<ImportResult> {
  return apiFetch('/import-folder', { method: 'POST', body: JSON.stringify({ path, tags }) })
}
