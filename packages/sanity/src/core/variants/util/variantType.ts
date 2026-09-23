import {type VariantTypeConfig} from '../../config/types'

/**
 * Type key used when config omits `types`, when a definition has no `metadata.type`,
 * and when a sticky variant id has no type prefix.
 *
 * @internal
 */
export const DEFAULT_VARIANT_TYPE_KEY = 'variant'

const VARIANT_TYPE_KEY_PATTERN = /^[a-z][a-z0-9_-]{0,63}$/

/**
 * @internal
 */
export function defaultVariantTypesRecord(): Record<string, VariantTypeConfig> {
  return {[DEFAULT_VARIANT_TYPE_KEY]: {label: 'Variant'}}
}

/**
 * @internal
 */
export function isVariantTypeKey(key: string): boolean {
  return VARIANT_TYPE_KEY_PATTERN.test(key)
}

/**
 * The type a definition belongs to. Missing `metadata.type` reads as `variant`.
 *
 * @internal
 */
export function getVariantType(variant: {metadata?: {type?: unknown}} | null | undefined): string {
  const type = variant?.metadata?.type

  if (typeof type === 'string' && type.trim()) {
    return type.trim()
  }

  return DEFAULT_VARIANT_TYPE_KEY
}
