export function calculatePercentile(numbers: number[], percentile: number): number {
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
