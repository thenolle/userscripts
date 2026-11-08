export type LimitKey = 'remaining_pro' | 'remaining_research' | 'remaining_agentic_research' | 'remaining_labs'
export type Status = 'healthy' | 'low' | 'critical' | 'empty' | 'unavailable'
export type Plan = 'paid' | 'free' | 'unknown'

export interface LimitDefinition {
  readonly label: string
  readonly total: number | null
  readonly period: string
  readonly window: number
}

export interface SourceLimit {
  monthly_limit: number | null
  remaining: number | null
}

export interface FreeQueriesPayload {
  available: boolean
  remaining_detail?: { kind?: string; remaining?: number; count?: number }
}

export interface RateLimitResponse extends Partial<Record<LimitKey, number>> {
  free_queries?: FreeQueriesPayload
  model_specific_limits?: Record<string, unknown>
  sources?: { source_to_limit?: Record<string, SourceLimit | null> }
}

export type SettingsResponse = Record<string, unknown>

export interface SettingField {
  readonly key: string
  readonly label: string
  readonly type: 'number' | 'bool' | 'string'
}

export interface ModeInfo {
  label: string
  key: LimitKey | null
}

export interface ActiveUsage extends ModeInfo {
  remaining: number | null
  total: number | null
  freeFallback: boolean
  period: string
  reset: string
  status: Status
}

export interface FreeQueriesInfo {
  available: boolean
  count: number | null
  kind: string | null
}

export interface Forecast {
  source: 'server' | 'learned'
  next: number
  full: number
  anchor: number
  progress: number
  confidence: number
  samples: number
  overdue: boolean
}

export interface AttemptDiagnostic {
  profile: string
  transport: string
  rate: number | null
  settings: number | null
  authenticated: boolean
  error?: string
}

export interface ApiDiagnostics {
  chosen: string | null
  account: 'none' | 'stored' | 'cookie' | 'captured' | 'session' | 'manual'
  accountPreview: string | null
  attempts: AttemptDiagnostic[]
}