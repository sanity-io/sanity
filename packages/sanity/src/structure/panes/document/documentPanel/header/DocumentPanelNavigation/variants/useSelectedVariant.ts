import {getVariantType, type SystemVariant, usePerspective} from 'sanity'

/**
 * The selected variant of the given type, or `undefined` when that type is on Default. Also
 * `undefined` while the variant definitions load.
 *
 * @internal
 */
export function useSelectedVariant(type: string): SystemVariant | undefined {
  const {selectedVariants} = usePerspective()
  return selectedVariants.find(
    (variant): variant is SystemVariant =>
      variant !== undefined && getVariantType(variant) === type,
  )
}
