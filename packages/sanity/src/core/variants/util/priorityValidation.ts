export type PriorityValidationError = 'invalid'

export function getPriorityValidationError(priority: number): PriorityValidationError | undefined {
  if (!Number.isFinite(priority)) {
    return 'invalid'
  }

  return undefined
}

export function getPriorityInputValidationError(
  input: string,
): PriorityValidationError | undefined {
  if (input.trim() === '') {
    return 'invalid'
  }

  return getPriorityValidationError(Number(input))
}
