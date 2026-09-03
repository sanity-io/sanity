import {type EditableSystemVariant} from '../types'
import {getVariantTitleValue} from './getIsVariantInvalid'

/**
 * The existing variants that a candidate variant would duplicate, per uniqueness check.
 *
 * @internal
 */
export interface VariantUniquenessValidation<T extends EditableSystemVariant> {
  /** The first other variant whose title matches the candidate's (trimmed, case-insensitive). */
  duplicateTitleOf: T | undefined
  /** The first other variant whose condition set exactly matches the candidate's. */
  duplicateConditionsOf: T | undefined
}

function getNormalizedConditions(
  conditions: EditableSystemVariant['conditions'],
): Map<string, string> {
  const normalized = new Map<string, string>()

  for (const [key, value] of Object.entries(conditions)) {
    const trimmedKey = key.trim()
    // Conditions come from stored documents, so guard against non-string values.
    const trimmedValue = typeof value === 'string' ? value.trim() : ''

    if (trimmedKey && trimmedValue) {
      normalized.set(trimmedKey, trimmedValue)
    }
  }

  return normalized
}

function conditionsAreEqual(a: Map<string, string>, b: Map<string, string>): boolean {
  if (a.size !== b.size) {
    return false
  }

  for (const [key, value] of a) {
    if (b.get(key) !== value) {
      return false
    }
  }

  return true
}

/**
 * Finds existing variants that the candidate would duplicate: one with the same title (trimmed,
 * case-insensitive) and one with exactly the same condition set (same number of conditions, same
 * keys, same trimmed values — key order is irrelevant). A variant whose conditions are a subset or
 * superset of the candidate's is not a duplicate.
 *
 * The candidate itself is excluded by `_id`, so an unchanged variant never matches itself when
 * editing. Empty titles and empty condition sets never match — those are covered by the
 * required-field validation.
 *
 * @internal
 */
export function getVariantUniquenessValidation<T extends EditableSystemVariant>(
  variant: EditableSystemVariant,
  allVariants: readonly T[],
): VariantUniquenessValidation<T> {
  const otherVariants = allVariants.filter((other) => other._id !== variant._id)

  const title = getVariantTitleValue(variant).toLowerCase()
  const conditions = getNormalizedConditions(variant.conditions)

  const duplicateTitleOf = title
    ? otherVariants.find((other) => getVariantTitleValue(other).toLowerCase() === title)
    : undefined

  const duplicateConditionsOf =
    conditions.size > 0
      ? otherVariants.find((other) =>
          conditionsAreEqual(conditions, getNormalizedConditions(other.conditions)),
        )
      : undefined

  return {duplicateTitleOf, duplicateConditionsOf}
}
