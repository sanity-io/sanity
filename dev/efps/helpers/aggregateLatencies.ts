import {type EfpsResult} from '../types'

function calculatePercentile(numbers: number[], percentile: number): number {
  // Sort the array in ascending order
  const sorted = numbers.slice().sort((a, b) => a - b)

  // Calculate the index
  const index = percentile * (sorted.length - 1)

  // If the index is an integer, return the value at that index
  if (Number.isInteger(index)) {
    return sorted[index]
  }

  // Otherwise, interpolate between the two nearest values
  const lowerIndex = Math.floor(index)
  const upperIndex = Math.ceil(index)
  const lowerValue = sorted[lowerIndex]
  const upperValue = sorted[upperIndex]

  const fraction = index - lowerIndex
  return lowerValue + (upperValue - lowerValue) * fraction
}

export function aggregateLatencies(values: number[]): EfpsResult['latency'] {
  return {
    p50: calculatePercentile(values, 0.5),
    p75: calculatePercentile(values, 0.75),
    p90: calculatePercentile(values, 0.9),
    p99: calculatePercentile(values, 0.99),
  }
}
