import {
  type CreateVariantAction,
  type SanityDocumentStub,
  type SanityClient,
  type SingleActionResult,
} from '@sanity/client'

import {type PerspectiveBundle, type TargetPerspective} from '../../perspective/types'
import {variantsApiClient} from '../../store/document/document-pair/utils/variantsApiClient'
import {getVariantId} from '../tool/util'
import {type SystemVariant} from '../types'
import {getBundleIdFromPerspective} from './getBundleIdFromPerspective'

function getSupportedBundleId(
  selectedPerspective: TargetPerspective,
): Exclude<PerspectiveBundle, 'published'> | undefined {
  const bundleId = getBundleIdFromPerspective(selectedPerspective)

  if (bundleId === 'published') {
    return undefined
  }

  return bundleId
}

/**
 * @internal
 */
export type BuildCreateVariantDocumentActionOptions = {
  variant: Pick<SystemVariant, '_id'>
  selectedPerspective: TargetPerspective
  documentGroupId: string
} & (
  | {
      document: SanityDocumentStub
    }
  | {
      baseId: string
      ifBaseRevisionId?: string
    }
)

type BaseOptions = {
  client: SanityClient
  signal?: AbortSignal
}

/**
 * @internal
 */
export type CreateVariantScopedDocumentOptions = BaseOptions &
  BuildCreateVariantDocumentActionOptions

/**
 * Builds the variants document create action that creates a variant-scoped version document in the
 * bundle of `selectedPerspective`, either from `document` or by copying `baseId`.
 *
 * @internal
 */
export function buildCreateVariantDocumentAction({
  variant,
  selectedPerspective,
  documentGroupId,
  ...options
}: BuildCreateVariantDocumentActionOptions): CreateVariantAction {
  const bundleId = getSupportedBundleId(selectedPerspective)

  const action: Pick<CreateVariantAction, 'actionType' | 'variantId' | 'publishedId' | 'bundleId'> =
    {
      actionType: 'sanity.action.document.variant.create',
      variantId: getVariantId(variant._id),
      ...(bundleId ? {bundleId} : {}),
      publishedId: documentGroupId,
    }

  if ('baseId' in options) {
    return {
      baseId: options.baseId,
      ...(typeof options.ifBaseRevisionId === 'string'
        ? {ifBaseRevisionId: options.ifBaseRevisionId}
        : {}),
      ...action,
    }
  }

  if ('document' in options) {
    return {
      document: options.document,
      ...action,
    }
  }

  throw new Error('`buildCreateVariantDocumentAction`: `baseId` or `document` must be provided.')
}

/**
 * Creates a variant-scoped version document via the variants document create action.
 *
 * @internal
 */
export async function createVariantScopedDocument({
  client,
  signal,
  ...options
}: CreateVariantScopedDocumentOptions): Promise<SingleActionResult> {
  return variantsApiClient(client).action(buildCreateVariantDocumentAction(options), {
    tag: 'variants.document.create',
    signal,
  })
}
