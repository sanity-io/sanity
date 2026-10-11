import {type VariantTypeConfig} from '../../config/types'

/**
 * Type key used when config omits `types`, when a definition has no `metadata.type`,
 * and when a sticky variant id has no type prefix.
 *
 * @internal
 */
export const DEFAULT_VARIANT_TYPE_KEY = 'variant'

const VARIANT_TYPE_KEY_PATTERN = /^[a-z][a-z0-9_-]{0,63}$/

const DEFAULT_VARIANT_TYPE_LABEL = 'Variant'

/**
 * @internal
 */
export function defaultVariantTypesRecord(): Record<string, VariantTypeConfig> {
  return {[DEFAULT_VARIANT_TYPE_KEY]: {label: DEFAULT_VARIANT_TYPE_LABEL}}
}

/**
 * Navbar label for a type. A configured label wins. The built-in `variant` type
 * falls back to "Variant"; every other type falls back to its key.
 *
 * @internal
 */
export function variantTypeLabel(key: string, label: string | undefined): string {
  const trimmed = label?.trim()

  if (trimmed) {
    return trimmed
  }

  if (key === DEFAULT_VARIANT_TYPE_KEY) {
    return DEFAULT_VARIANT_TYPE_LABEL
  }

  return key
}

/**
 * @internal
 */
export function isVariantTypeKey(key: string): boolean {
  return VARIANT_TYPE_KEY_PATTERN.test(key)
}

/**
 * Phase 1 only accepts the `variant` type. Delete this function to allow other type keys.
 *
 * @internal
 */
export function assertOnlyVariantType(key: string): void {
  if (key !== DEFAULT_VARIANT_TYPE_KEY) {
    throw new Error(
      `Expected \`beta.variants.types\` to only include "${DEFAULT_VARIANT_TYPE_KEY}", but received ${JSON.stringify(key)}`,
    )
  }
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
