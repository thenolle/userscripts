export interface Sample {
  value: number
  at: number
}

export interface WindowEstimate {
  window: number
  confidence: number
  samples: number
}

export interface EstimatorTuning {
  halfLife: number
  priorWeight: number
  outlierSigma: number
}

export const median = (values: readonly number[]): number => {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = sorted.length >> 1
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2
}

export const estimateWindow = (samples: readonly Sample[], prior: number, bias: number, tuning: EstimatorTuning): WindowEstimate => {
  const values = samples.map(({ value }) => Math.max(0, value - bias))
  if (!values.length) return { window: prior, confidence: 0, samples: 0 }
  const center = median(values)
  const spread = 1.4826 * median(values.map((value) => Math.abs(value - center)))
  const rows = values.map((value, index) => ({ value, rank: values.length - 1 - index })).filter(({ value }) => spread === 0 || Math.abs(value - center) <= tuning.outlierSigma * spread)
  const weights = rows.map(({ rank }) => 0.5 ** (rank / tuning.halfLife))
  const mass = weights.reduce((total, weight) => total + weight, 0)
  const weighted = rows.reduce((total, { value }, index) => total + value * weights[index]!, 0)
  return {
    window: (tuning.priorWeight * prior + weighted) / (tuning.priorWeight + mass),
    confidence: mass / (mass + tuning.priorWeight),
    samples: rows.length
  }
}