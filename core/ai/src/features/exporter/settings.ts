import { storage } from '../../platform'
import type { CitationStyle } from './citations'

export type ExportFormat = 'md' | 'txt' | 'docx' | 'pdf' | 'json'

export interface ExportSettings {
  format: ExportFormat
  style: CitationStyle
  stripLogo: boolean
}

const STORAGE_KEY = 'exporter:settings'

export const DEFAULT_EXPORT_SETTINGS: Readonly<ExportSettings> = { format: 'md', style: 'parenthesized', stripLogo: true }

export const loadExportSettings = (): ExportSettings => ({ ...DEFAULT_EXPORT_SETTINGS, ...storage.get<Partial<ExportSettings>>(STORAGE_KEY, {}) })

export const saveExportSettings = (settings: ExportSettings): void => storage.set(STORAGE_KEY, settings)