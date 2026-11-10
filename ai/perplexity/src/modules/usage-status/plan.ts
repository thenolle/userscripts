import type { Plan, SettingsResponse } from './types'

export interface PlanInfo {
  readonly plan: Plan
  readonly label: string
}

const text = (value: unknown): string => typeof value === 'string' ? value.trim() : ''
const normalized = (value: unknown): string => text(value).toLowerCase()

const UNKNOWN = new Set(['', 'unknown', 'null', 'undefined', 'n/a'])
const FREE = new Set(['free', 'none', 'basic'])
const ACTIVE = new Set(['active', 'trialing', 'trial'])
const INACTIVE = new Set(['inactive', 'canceled', 'cancelled', 'expired', 'unpaid', 'incomplete_expired'])

const capitalize = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1)

export const resolvePlan = (settings: SettingsResponse | null): PlanInfo => {
  if (!settings) return { plan: 'unknown', label: 'Unavailable' }

  const tier = text(settings['subscription_tier'])
  const tierKey = normalized(tier)
  const status = normalized(settings['subscription_status'])
  const billing = [
    normalized(settings['stripe_status']),
    normalized(settings['revenuecat_status'])
  ]
  const active = ACTIVE.has(status) || billing.some((value) => ACTIVE.has(value))
  const inactive = INACTIVE.has(status)
  const suffix = status ? ` (${status})` : ''

  if (FREE.has(tierKey)) {
    return active
      ? { plan: 'unknown', label: 'Active subscription · tier not identified' }
      : { plan: 'free', label: `Free${suffix}` }
  }

  if (UNKNOWN.has(tierKey)) {
    if (active) return { plan: 'paid', label: 'Paid subscription · tier not reported' }
    return { plan: 'unknown', label: status ? `Tier not reported (${status})` : 'Tier not reported' }
  }

  return {
    plan: inactive ? 'unknown' : 'paid',
    label: `${capitalize(tier)}${suffix}`
  }
}

export const looksAuthenticated = (settings: SettingsResponse | null): boolean => {
  if (!settings) return false
  return [
    'subscription_tier',
    'subscription_status',
    'subscription_source',
    'stripe_status',
    'revenuecat_status'
  ].some((key) => {
    const value = normalized(settings[key])
    return !UNKNOWN.has(value)
  })
}
