import {decodeVariantIdFromRoute} from '../variants/tool/util'
import {type SystemVariant} from '../variants/types'

/**
 * Resolves the sticky variant short id to a variant definition.
 * Returns undefined while loading (empty byId) or when the variant does not exist.
 *
 * @internal
 */
export function getSelectedVariant(options: {
  selectedVariantName: string | undefined
  variantsById: Map<string, SystemVariant>
}): SystemVariant | undefined {
  const {selectedVariantName, variantsById} = options

  if (!selectedVariantName) {
    return undefined
  }

  const variantDocumentId = decodeVariantIdFromRoute(selectedVariantName)

  if (!variantDocumentId) {
    return undefined
  }

  return variantsById.get(variantDocumentId)
}
