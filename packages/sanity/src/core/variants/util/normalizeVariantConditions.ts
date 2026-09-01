import {isRecord} from '../../util/isRecord'
import {
  getConditionKeyValidationError,
  getConditionValueValidationError,
} from './conditionValidation'

/**
 * A configured condition value after invalid entries have been dropped.
 *
 * @internal
 */
export interface NormalizedVariantConditionValue {
  value: string
  title: string
  description?: string
}

/**
 * A configured condition entry after invalid keys/values have been dropped.
 *
 * @internal
 */
export interface NormalizedVariantConditionMap {
  name: string
  title: string
  description?: string
  values: NormalizedVariantConditionValue[]
}

function optionalTrimmedString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function normalizeConditionValues(values: unknown, key: string): NormalizedVariantConditionValue[] {
  if (!Array.isArray(values)) {
    console.warn(`[sanity] Dropped conditions entry "${key}": values must be an array`)
    return []
  }

  const seen = new Set<string>()
  const normalized: NormalizedVariantConditionValue[] = []

  for (const item of values) {
    if (typeof item === 'string') {
      const value = item.trim()
      const valueError = getConditionValueValidationError(value)

      if (valueError) {
        console.warn(`[sanity] Dropped invalid conditions value "${item}" for key "${key}"`)
        continue
      }

      if (seen.has(value)) {
        console.warn(`[sanity] Dropped duplicate conditions value "${value}" for key "${key}"`)
        continue
      }

      seen.add(value)
      normalized.push({value, title: value})
      continue
    }

    if (!isRecord(item) || typeof item.value !== 'string') {
      console.warn(`[sanity] Dropped invalid conditions value for key "${key}"`)
      continue
    }

    const value = item.value.trim()
    const valueError = getConditionValueValidationError(value)

    if (valueError) {
      console.warn(`[sanity] Dropped invalid conditions value "${item.value}" for key "${key}"`)
      continue
    }

    if (seen.has(value)) {
      console.warn(`[sanity] Dropped duplicate conditions value "${value}" for key "${key}"`)
      continue
    }

    seen.add(value)
    normalized.push({
      value,
      title: optionalTrimmedString(item.title) ?? value,
      description: optionalTrimmedString(item.description),
    })
  }

  return normalized
}

/**
 * Validates and normalizes a resolved `beta.variants.conditions` array.
 * Invalid keys and values are dropped with a warning so the picker never offers them.
 *
 * @internal
 */
export function normalizeVariantConditions(input: unknown): NormalizedVariantConditionMap[] {
  if (!Array.isArray(input)) {
    throw new Error('Expected conditions to resolve to an array')
  }

  const seen = new Set<string>()
  const normalized: NormalizedVariantConditionMap[] = []

  for (const item of input) {
    if (!isRecord(item) || typeof item.name !== 'string') {
      console.warn(
        '[sanity] Dropped invalid beta.variants.conditions entry: expected an object with a name string',
      )
      continue
    }

    const name = item.name.trim()
    const keyError = getConditionKeyValidationError(name)

    if (keyError) {
      console.warn(`[sanity] Dropped invalid conditions key "${item.name}"`)
      continue
    }

    if (seen.has(name)) {
      console.warn(`[sanity] Dropped duplicate conditions key "${name}"`)
      continue
    }

    const values = normalizeConditionValues(item.values, name)

    if (values.length === 0) {
      console.warn(`[sanity] Dropped conditions entry "${name}": no valid values`)
      continue
    }

    seen.add(name)
    normalized.push({
      name,
      title: optionalTrimmedString(item.title) ?? name,
      description: optionalTrimmedString(item.description),
      values,
    })
  }

  return normalized
}
