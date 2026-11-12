import { isPositiveNumber } from '@nolly/core'

export type CapacitySource = 'api' | 'default' | 'observed'

export interface Capacity {
	readonly total: number | null
	readonly source: CapacitySource | null
}

export interface CapacityInput {
	readonly reported: number | null
	readonly remaining: number | null
	readonly observedPeak: number
	readonly fallback: number | null
}

const NONE: Capacity = { total: null, source: null }

export const resolveCapacity = ({ reported, remaining, observedPeak, fallback }: CapacityInput): Capacity => {
	const current = isPositiveNumber(remaining) ? remaining : 0
	const floor = Math.max(current, observedPeak)
	if (isPositiveNumber(reported) && reported >= current) return { total: reported, source: 'api' }
	if (isPositiveNumber(fallback) && floor <= fallback) return { total: fallback, source: 'default' }
	if (floor > 0) return { total: floor, source: 'observed' }
	return NONE
}