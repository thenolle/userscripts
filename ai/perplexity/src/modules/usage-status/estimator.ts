export interface Sample {
  readonly lo: number
  readonly hi: number
  readonly at: number
}

export interface WindowEstimate {
  readonly window: number
  readonly confidence: number
  readonly samples: number
  readonly margin: number
  readonly coverage: number
}

export interface EstimatorTuning {
  readonly halfLife: number
  readonly tolerances: readonly number[]
  readonly relative: readonly number[]
  readonly consensus: number
  readonly tight: number
}

export const median = (values: readonly number[]): number => {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const middle = sorted.length >> 1
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2
}

interface Interval {
  readonly a: number
  readonly b: number
  readonly mid: number
  readonly weight: number
  readonly info: number
}

interface Consensus {
  readonly start: number
  readonly end: number
  readonly covered: readonly Interval[]
  readonly fraction: number
}

const consensusAt = (intervals: readonly Interval[], prior: number): Consensus => {
  const points = [...new Set(intervals.flatMap(({ a, b }) => [a, b]))].sort((x, y) => x - y)
  const total = intervals.reduce((sum, { weight }) => sum + weight, 0)
  const covers = points.slice(0, -1).map((start, index) => {
    const end = points[index + 1]!
    const middle = (start + end) / 2
    const weight = intervals.reduce((sum, item) => (item.a <= middle && middle <= item.b ? sum + item.weight : sum), 0)
    return { start, end, weight }
  })
  const best = Math.max(...covers.map(({ weight }) => weight))
  const regions: { start: number; end: number }[] = []
  for (const cover of covers) {
    if (cover.weight < best - 1e-9) continue
    const last = regions[regions.length - 1]
    if (last && Math.abs(last.end - cover.start) < 1e-6) last.end = cover.end
    else regions.push({ start: cover.start, end: cover.end })
  }
  const distance = (region: { start: number; end: number }): number => (prior < region.start ? region.start - prior : prior > region.end ? prior - region.end : 0)
  const chosen = regions.reduce((winner, region) => (distance(region) < distance(winner) ? region : winner), regions[0]!)
  const middle = (chosen.start + chosen.end) / 2
  return { start: chosen.start, end: chosen.end, covered: intervals.filter(({ a, b }) => a <= middle && middle <= b), fraction: total > 0 ? best / total : 0 }
}

const weightedSpread = (items: readonly Interval[], center: number): number => {
  const total = items.reduce((sum, { weight }) => sum + weight, 0)
  if (total <= 0) return 0
  return Math.sqrt(items.reduce((sum, { weight, mid }) => sum + weight * (mid - center) ** 2, 0) / total)
}

export const estimateWindow = (samples: readonly Sample[], prior: number, tuning: EstimatorTuning): WindowEstimate => {
  if (!samples.length) return { window: prior, confidence: 0, samples: 0, margin: prior * 0.5, coverage: 0 }
  const count = samples.length
  const levels = [...new Set([...tuning.tolerances, ...tuning.relative.map((ratio) => ratio * prior)])].sort((x, y) => x - y)
  let result: { consensus: Consensus; tolerance: number } | null = null
  for (const tolerance of levels) {
    const scale = Math.max(tolerance, 60_000)
    const intervals = samples.map((sample, index): Interval => {
      const width = Math.max(0, sample.hi - sample.lo)
      const info = 1 / (1 + width / scale)
      return { a: sample.lo - tolerance, b: sample.hi + tolerance, mid: (sample.lo + sample.hi) / 2, weight: info * 0.5 ** ((count - 1 - index) / tuning.halfLife), info }
    })
    const consensus = consensusAt(intervals, prior)
    result = { consensus, tolerance }
    if (consensus.fraction >= tuning.consensus) break
  }
  const { consensus, tolerance } = result!
  const informative = consensus.covered.reduce((sum, { info }) => sum + info, 0)
  const tight = tolerance <= tuning.tight
  const center = (consensus.start + consensus.end) / 2
  const spread = weightedSpread(consensus.covered, center)
  const mass = consensus.covered.reduce((sum, { weight }) => sum + weight, 0)
  const mean = mass > 0 ? consensus.covered.reduce((sum, { weight, mid }) => sum + weight * mid, 0) / mass : center
  const window = Math.min(consensus.end, Math.max(consensus.start, tight ? prior : mean))
  const margin = tight ? (consensus.end - consensus.start) / 2 + tolerance : 2 * spread + tolerance
  const precision = 1 / (1 + margin / (0.01 * Math.max(window, 1)))
  const confidence = Math.max(0, Math.min(1, consensus.fraction * (informative / (informative + 2)) * precision))
  return { window, confidence, samples: consensus.covered.length, margin, coverage: consensus.fraction }
}
