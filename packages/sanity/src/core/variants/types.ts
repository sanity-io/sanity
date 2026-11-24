import {type SanityDocument, type PortableTextBlock} from '@sanity/types'

import {type VARIANT_DOCUMENT_TYPE, type VARIANT_DOCUMENTS_PATH} from './store/constants'

/**
 * @internal
 */
export type VariantId = `${typeof VARIANT_DOCUMENTS_PATH}.${string}`

/**
 * One targeting condition of a variant definition, e.g. `{condition: 'audience', value: 'loyal'}`.
 *
 * @internal
 */
export interface VariantCondition {
  _key: string
  condition: string
  value: string
}

/**
 * The shape `conditions` had before it became an array of {@link VariantCondition}: a map from
 * condition name to value. Content Lake still returns it for definitions that have not been
 * migrated yet.
 *
 * @internal
 */
export type LegacyVariantConditions = Record<string, string>

/**
 * The fields a variant definition has in both `conditions` shapes. `SanityDocument` carries an
 * index signature, which `Omit` would collapse, so both shapes extend this instead.
 */
interface SystemVariantBase extends SanityDocument {
  _type: typeof VARIANT_DOCUMENT_TYPE
  _id: VariantId
  name?: string
  priority: number // defaults to 0.
  metadata?: {
    title?: string
    description?: PortableTextBlock[]
    /** Variant type key. Missing values are read as `variant`. */
    type?: string
    [key: string]: unknown // <-- Here we can store anything useful for the UI
  }
}

export interface SystemVariant extends SystemVariantBase {
  conditions: VariantCondition[]
  /**
   * Set by the variants store, never stored: `true` when Content Lake returned `conditions` in
   * the legacy object shape, so the definition still has to be migrated to the array shape.
   */
  needsMigration: boolean
}

/**
 * @internal
 */
export type EditableSystemVariant = Pick<
  SystemVariant,
  '_id' | '_type' | 'conditions' | 'priority' | 'metadata'
>

/**
 * A variant definition as Content Lake returns it, before the variants store normalizes it into a
 * {@link SystemVariant}.
 *
 * @internal
 */
export interface StoredSystemVariant extends SystemVariantBase {
  conditions?: VariantCondition[] | LegacyVariantConditions | null
}

/**
 * @internal
 */
export function isVariantId(maybeVariantId: unknown): maybeVariantId is VariantId {
  if (typeof maybeVariantId !== 'string') {
    return false
  }

  return maybeVariantId.match(/^_\.variants\.['a-zA-Z0-9._-]+$/) !== null
}
