import type { Plan, SettingsResponse } from './types'

export interface PlanInfo {
  readonly plan: Plan
  readonly label: string
}

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

const capitalize = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1)

export const resolvePlan = (settings: SettingsResponse | null): PlanInfo => {
  if (!settings) return { plan: 'unknown', label: '—' }
  const tier = text(settings['subscription_tier'])
  const status = text(settings['subscription_status'])
  const lowered = tier.toLowerCase()
  const paidTier = lowered !== '' && lowered !== 'free' && lowered !== 'none'
  const active = ['active', 'trialing'].includes(status.toLowerCase())
  const billing = Boolean(text(settings['stripe_status']) || text(settings['revenuecat_status']))
  const paid = paidTier || active || billing
  const label = tier ? `${capitalize(tier)}${status ? ` (${status})` : ''}` : paid ? 'Paid' : 'None reported'
  return { plan: paid ? 'paid' : 'free', label }
}

export const looksAuthenticated = (settings: SettingsResponse | null): boolean => {
  if (!settings) return false
  return ['subscription_tier', 'subscription_status', 'subscription_source', 'stripe_status', 'revenuecat_status'].some((key) => text(settings[key]) !== '')
}