import type { Status } from './types'

export const formatDuration = (milliseconds: number): string => {
  if (milliseconds <= 0) return 'now'
  const totalSeconds = Math.ceil(milliseconds / 1000)
  const days = Math.floor(totalSeconds / 86_400)
  const hours = Math.floor((totalSeconds % 86_400) / 3_600)
  const minutes = Math.floor((totalSeconds % 3_600) / 60)
  const seconds = totalSeconds % 60
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`
}

export const formatAgo = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000)
  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  return `${Math.floor(seconds / 60)}m ago`
}

export const getStatus = (remaining: number | null, total: number | null): Status => {
  if (remaining === null) return 'unavailable'
  if (remaining <= 0) return 'empty'
  if (!total) return 'healthy'
  const ratio = remaining / total
  if (ratio > 0.6) return 'healthy'
  return ratio > 0.25 ? 'low' : 'critical'
}