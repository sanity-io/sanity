import {isRecord} from './isRecord'

// deep object assign for objects
// note: doesn't mutate target
export default function deepAssign(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> {
  const result = {...target, ...source}

  Object.keys(result).forEach((key) => {
    const sourceVal = source[key]
    const targetVal = target[key]
    if (isRecord(sourceVal) && isRecord(targetVal)) {
      result[key] = deepAssign(targetVal, sourceVal)
    }
  })
  return result
}
