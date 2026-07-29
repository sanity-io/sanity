import {isPortableTextBlock, toPlainText} from '@portabletext/toolkit'
import {type DocumentSystem} from '@sanity/types'

import {type PerspectiveBundle} from '../../perspective/types'
import {DOCUMENT_SYSTEM_FIELD} from '../../preview/constants'
import {VARIANT_DOCUMENTS_PATH} from '../store/constants'
import {type SystemVariant} from '../types'

const VARIANT_ID_PREFIX = `${VARIANT_DOCUMENTS_PATH}.`

/**
 * Published documents omit `bundleId` on `_system`, but `PerspectiveBundle` also includes the
 * `'published'` literal. Call sites should treat both as published without rewriting the value.
 *
 * @internal
 */
export function isPublishedBundleId(bundleId: PerspectiveBundle | undefined): boolean {
  return bundleId === undefined || bundleId === 'published'
}

/**
 * @internal
 */
export function isReleaseBundle(bundleId: PerspectiveBundle | undefined): boolean {
  return !isPublishedBundleId(bundleId) && bundleId !== 'drafts'
}

/**
 * @internal
 */
export function getVariantId(variantDocumentId: string): string {
  return variantDocumentId.startsWith(VARIANT_ID_PREFIX)
    ? variantDocumentId.slice(VARIANT_ID_PREFIX.length)
    : variantDocumentId
}

/**
 * Returns the short variant id for sticky params from a document's `_system.variant._ref`.
 *
 * @internal
 */
export function getVariantIdFromDocument(document: Record<string, unknown>): string | undefined {
  const system = document[DOCUMENT_SYSTEM_FIELD] as DocumentSystem | undefined
  const variantRef = system?.variant?._ref

  return variantRef ? getVariantId(variantRef) : undefined
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
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join(', ')
}

/**
 * Decodes router state / URL path segments back to a variant document id.
 *
 * @internal
 */
export function decodeVariantIdFromRoute(variantIdRaw: string | undefined): string | undefined {
  if (!variantIdRaw) {
    return undefined
  }

  let decoded: string

  try {
    decoded = decodeURIComponent(variantIdRaw)
  } catch {
    decoded = variantIdRaw
  }

  if (decoded.startsWith(`${VARIANT_ID_PREFIX}`)) {
    return decoded
  }

  return `${VARIANT_ID_PREFIX}${decoded}`
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

/** A filterable condition dimension and the distinct values seen for it across all variants. */
export interface ConditionFacet {
  key: string
  values: string[]
}

/**
 * Derive the filterable facets from every variant's `conditions` key-value pairs: one facet per
 * condition key, with its distinct values. Keys and values are sorted for a stable UI. Because the
 * facets come from the full variant list (not the filtered view), the available options never shrink
 * as filters are applied.
 */
export function buildConditionFacets(variants: SystemVariant[]): ConditionFacet[] {
  const valuesByKey = new Map<string, Set<string>>()

  for (const variant of variants) {
    for (const [key, value] of Object.entries(variant.conditions)) {
      if (typeof value !== 'string' || value.length === 0) continue
      const values = valuesByKey.get(key) ?? new Set<string>()
      values.add(value)
      valuesByKey.set(key, values)
    }
  }

  return Array.from(valuesByKey.entries())
    .map(([key, values]) => ({key, values: Array.from(values).sort((a, b) => a.localeCompare(b))}))
    .sort((a, b) => a.key.localeCompare(b.key))
}

/**
 * A variant matches when, for every active facet, its value for that condition key is one of the
 * selected values. Selecting several values within one facet is an OR; different facets AND together.
 * An empty selection for a facet imposes no constraint.
 */
export function variantMatchesConditionFilters(
  variant: SystemVariant,
  filters: Record<string, string[]>,
): boolean {
  return Object.entries(filters).every(([key, selectedValues]) => {
    if (selectedValues.length === 0) return true
    const value = variant.conditions[key]
    return typeof value === 'string' && selectedValues.includes(value)
  })
}

/** Variant definition plus overview document count (see `TableVariant`). */
export type VariantWithDocumentCount = SystemVariant & {
  documentCount?: number | null
}

/**
 * Resolves bulk-delete targets from the full variant list and snapshotted row keys.
 * Must not use condition-filtered table rows, or changing filters while the dialog is open
 * can drop selected ids from the confirm action.
 */
export function resolveBulkDeleteVariants(
  keys: readonly string[],
  variantsList: SystemVariant[],
  documentCounts: Record<string, number> | null | undefined,
  documentCountsError: Error | null | undefined,
): VariantWithDocumentCount[] {
  const keySet = new Set(keys)
  return variantsList
    .filter((variant) => keySet.has(variant._id))
    .map((variant) => ({
      ...variant,
      documentCount: documentCounts?.[variant._id] ?? (documentCountsError ? null : undefined),
    }))
}
