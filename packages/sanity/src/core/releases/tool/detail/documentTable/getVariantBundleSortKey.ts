import {VARIANT_DOCUMENTS_PATH} from '../../../../variants/store/constants'
import {
  getVariantId,
  getVariantIdFromDocument,
  getVariantTitle,
} from '../../../../variants/tool/util'
import {type SystemVariant} from '../../../../variants/types'
import {type BundleDocument} from '../useBundleDocuments'

/** @internal - exported for unit testing only */
export function getVariantDefinitionRef(document: BundleDocument['document']): string | undefined {
  const shortVariantId = getVariantIdFromDocument(document)
  if (!shortVariantId) return undefined

  return `${VARIANT_DOCUMENTS_PATH}.${shortVariantId}`
}

/** @internal - exported for unit testing only */
export function getVariantBundleSortKey(
  row: BundleDocument,
  variantsById: Map<string, SystemVariant>,
): string {
  const variantRef = getVariantDefinitionRef(row.document)
  if (!variantRef) return ''

  const variant = variantsById.get(variantRef)
  const label = variant ? getVariantTitle(variant) : getVariantId(variantRef)
  return label.toLowerCase()
}
