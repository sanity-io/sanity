export const MIN_VARIANT_PRIORITY = 0
export const MAX_VARIANT_PRIORITY = 100

export type PriorityValidationError = 'invalid' | 'out-of-range'

export function getPriorityValidationError(priority: number): PriorityValidationError | undefined {
  if (!Number.isFinite(priority) || !Number.isInteger(priority)) {
    return 'invalid'
  }

  if (priority < MIN_VARIANT_PRIORITY || priority > MAX_VARIANT_PRIORITY) {
    return 'out-of-range'
  }

  return undefined
}
