import {isPortableTextBlock, toPlainText} from '@portabletext/toolkit'

import {VARIANT_DOCUMENTS_PATH} from '../store/constants'
import {type SystemVariant} from '../types'

const VARIANT_ID_PREFIX = `${VARIANT_DOCUMENTS_PATH}.`

/**
 * @internal
 */
export function getVariantId(variantDocumentId: string): string {
  return variantDocumentId.startsWith(VARIANT_ID_PREFIX)
    ? variantDocumentId.slice(VARIANT_ID_PREFIX.length)
    : variantDocumentId
}

/**
 * @internal
 */
export function getVariantTitle(variant: SystemVariant): string {
  const title = variant.metadata?.title

  if (typeof title === 'string' && title.trim()) {
    return title
  }

  return getVariantId(variant._id)
}

/**
 * @internal
 */
export function getVariantConditionsText(conditions: SystemVariant['conditions']): string {
  return Object.entries(conditions)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ')
}

/**
 * @internal
 */
export function getVariantDescription(variant: SystemVariant): string {
  const description = variant.metadata?.description

  if (!Array.isArray(description) || !description.every(isPortableTextBlock)) {
    return ''
  }

  return toPlainText(description).trim()
}

/**
 * @internal
 */
export function filterVariantsForSearch(
  variants: SystemVariant[],
  searchTerm: string,
): SystemVariant[] {
  const normalizedSearchTerm = searchTerm.trim().toLowerCase()

  if (!normalizedSearchTerm) {
    return variants
  }

  return variants.filter((variant) => {
    const searchableValues = [
      getVariantTitle(variant),
      getVariantId(variant._id),
      ...Object.entries(variant.conditions).flat(),
    ]

    return searchableValues.some((value) => value.toLowerCase().includes(normalizedSearchTerm))
  })
}
