import {type SystemVariant} from '../variants/types'

/**
 * The first sticky selection document editing still uses.
 *
 * Call sites stay here until editing can take more than one variant.
 * Pass `selectedVariantNames` for the id, or `selectedVariants` for the definition.
 *
 * @internal
 */
export function getDefaultVariant(selectedVariantNames: readonly string[]): string | undefined
export function getDefaultVariant(
  selectedVariants: readonly (SystemVariant | undefined)[],
): SystemVariant | undefined
export function getDefaultVariant(
  selected: readonly (string | SystemVariant | undefined)[],
): string | SystemVariant | undefined {
  return selected[0]
}
