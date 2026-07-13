import {type SanityClient, type SingleActionResult} from '@sanity/client'
import {getPublishedId} from '@sanity/client/csm'
import {type SanityDocumentLike} from '@sanity/types'

import {type TargetPerspective} from '../../perspective/types'
import {
  type VariantDocumentBundleId,
  type VariantDocumentCreateFromBaseAction,
  variantsClient,
} from '../store/variantsClient'
import {getVariantId} from '../tool/util'
import {type SystemVariant} from '../types'
import {getBundleIdFromPerspective} from './getBundleIdFromPerspective'

function getSupportedBundleId(
  selectedPerspective: TargetPerspective,
): VariantDocumentBundleId | undefined {
  const bundleId = getBundleIdFromPerspective(selectedPerspective)

  if (bundleId === 'published') {
    return undefined
  }

  return bundleId
}

/**
 * Creates a variant-scoped version document via the variants document create action.
 *
 * @internal
 */
export async function createVariantScopedDocument({
  client,
  document,
  variant,
  selectedPerspective,
}: {
  client: SanityClient
  /** Source document whose fields are copied into the new variant-scoped version. */
  document: SanityDocumentLike
  variant: SystemVariant
  selectedPerspective: TargetPerspective
}): Promise<SingleActionResult> {
  if (!document._id) {
    throw new Error('Source document must have an _id')
  }

  const publishedId = getPublishedId(document._id)
  const bundleId = getSupportedBundleId(selectedPerspective)

  const action: VariantDocumentCreateFromBaseAction = {
    actionType: 'sanity.action.document.variant.create',
    publishedId,
    variantId: getVariantId(variant._id),
    baseId: document._id,
    ...(document._rev ? {ifBaseRevisionId: document._rev} : {}),
    ...(bundleId ? {bundleId} : {}),
  }

  return variantsClient(client).action(action, {tag: 'variants.document.create'})
}
