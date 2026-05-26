const CONDITION_KEY_REGEX = /^[a-z][a-z0-9_-]{0,63}$/
const RESERVED_KEY_PREFIXES = ['_', '$'] as const

export type ConditionKeyValidationError = 'invalid' | 'reserved'

export function getConditionKeyValidationError(
  key: string,
): ConditionKeyValidationError | undefined {
  const trimmedKey = key.trim()

  if (!trimmedKey) {
    return undefined
  }

  for (const prefix of RESERVED_KEY_PREFIXES) {
    if (trimmedKey.startsWith(prefix)) {
      return 'reserved'
    }
  }

  if (!CONDITION_KEY_REGEX.test(trimmedKey)) {
    return 'invalid'
  }

  return undefined
}

export function getConditionValueValidationError(value: string): 'empty' | undefined {
  if (!value.trim()) {
    return 'empty'
  }

  return undefined
}
