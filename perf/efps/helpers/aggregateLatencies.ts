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

function calculateSpread(numbers: number[]) {
  const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length

  // calculate the sum of squared differences from the mean
  const squaredDiffs = numbers.map((num) => Math.pow(num - mean, 2))
  const sumSquaredDiffs = squaredDiffs.reduce((sum, diff) => sum + diff, 0)

  const variance = sumSquaredDiffs / (numbers.length - 1)
  const standardDeviation = Math.sqrt(variance)

  // We assume normal distribution and multiply the standard deviations by 1.96
  // which aims to represent 95% of the population
  return 1.96 * standardDeviation
}

export function aggregateLatencies(values: number[]): EfpsResult['latency'] {
  return {
    median: calculatePercentile(values, 0.5),
    spread: calculateSpread(values),
    p75: calculatePercentile(values, 0.75),
    p90: calculatePercentile(values, 0.9),
    p99: calculatePercentile(values, 0.99),
  }
}
