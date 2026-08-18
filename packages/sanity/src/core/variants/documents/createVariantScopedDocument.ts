import {type SanityClient, type SingleActionResult} from '@sanity/client'
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

type BaseOptions = {
  client: SanityClient
  variant: Pick<SystemVariant, '_id'>
  selectedPerspective: TargetPerspective
  documentGroupId: string
  signal?: AbortSignal
}

/**
 * @internal
 */
export type CreateVariantScopedDocumentOptions = BaseOptions &
  (
    | {
        document: Omit<SanityDocumentLike, '_id'>
      }
    | {
        baseId: string
        ifBaseRevisionId?: string
      }
  )

/**
 * Creates a variant-scoped version document via the variants document create action.
 *
 * @internal
 */
export async function createVariantScopedDocument({
  client,
  variant,
  selectedPerspective,
  documentGroupId,
  signal,
  ...options
}: CreateVariantScopedDocumentOptions): Promise<SingleActionResult> {
  const bundleId = getSupportedBundleId(selectedPerspective)

  const action: Pick<
    VariantDocumentCreateFromBaseAction,
    'actionType' | 'variantId' | 'publishedId' | 'bundleId'
  > = {
    actionType: 'sanity.action.document.variant.create',
    variantId: getVariantId(variant._id),
    ...(bundleId ? {bundleId} : {}),
    publishedId: documentGroupId,
  }

  if ('baseId' in options) {
    return variantsClient(client).action(
      {
        baseId: options.baseId,
        ...(typeof options.ifBaseRevisionId === 'string'
          ? {ifBaseRevisionId: options.ifBaseRevisionId}
          : {}),
        ...action,
      },
      {
        tag: 'variants.document.create',
        signal,
      },
    )
  }

  if ('document' in options) {
    return variantsClient(client).action(
      {
        document: options.document,
        ...action,
      },
      {
        tag: 'variants.document.create',
        signal,
      },
    )
  }

  throw new Error('`createVariantScopedDocument`: `baseId` or `document` must be provided.')
}
