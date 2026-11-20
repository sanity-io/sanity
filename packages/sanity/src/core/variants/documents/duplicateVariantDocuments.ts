import {type MultipleActionResult, type SanityClient} from '@sanity/client'

import {variantsApiClient} from '../../store/document/document-pair/utils/variantsApiClient'
import {type SystemVariant} from '../types'
import {buildCreateVariantDocumentAction} from './createVariantScopedDocument'
import {type VariantDocumentDuplicate} from './getVariantDocumentDuplicationPlan'

/**
 * Copies document versions of a variant into another variant in a single transaction, so either
 * every version is copied or none is. The target variant definition must already exist.
 *
 * Resolves to `undefined` without a request when there is nothing to copy.
 *
 * @internal
 */
export async function duplicateVariantDocuments({
  client,
  variant,
  documents,
}: {
  client: SanityClient
  variant: Pick<SystemVariant, '_id'>
  documents: VariantDocumentDuplicate[]
}): Promise<MultipleActionResult | undefined> {
  if (documents.length === 0) {
    return undefined
  }

  const actions = documents.map(({documentGroupId, baseId, perspective}) =>
    buildCreateVariantDocumentAction({
      variant,
      documentGroupId,
      baseId,
      selectedPerspective: perspective,
    }),
  )

  return variantsApiClient(client).action(actions, {tag: 'variants.duplicate.documents'})
}
