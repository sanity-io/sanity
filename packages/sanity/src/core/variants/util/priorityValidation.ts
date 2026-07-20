export type PriorityValidationError = 'invalid'

export function getPriorityValidationError(priority: number): PriorityValidationError | undefined {
  if (!Number.isFinite(priority)) {
    return 'invalid'
  }

  return undefined
}
