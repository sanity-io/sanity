const CONDITION_KEY_REGEX = /^[a-z][a-z0-9_-]{0,63}$/
const CONDITION_SEPARATOR = ':'
const RESERVED_KEY_PREFIXES = ['_', '$'] as const

export type ConditionKeyValidationError = 'invalid' | 'reserved'
export type ConditionValueValidationError = 'empty' | 'invalid'

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

  if (trimmedKey.includes(CONDITION_SEPARATOR) || !CONDITION_KEY_REGEX.test(trimmedKey)) {
    return 'invalid'
  }

  return undefined
}

export function getConditionValueValidationError(
  value: string,
): ConditionValueValidationError | undefined {
  if (!value.trim()) {
    return 'empty'
  }

  if (value.includes(CONDITION_SEPARATOR)) {
    return 'invalid'
  }

  return undefined
}
