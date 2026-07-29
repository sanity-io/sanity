import {type SingleActionResult} from '@sanity/client'
import {useCallback} from 'react'

import {useClient} from '../../hooks/useClient'
import {
  createVariantScopedDocument,
  type CreateVariantScopedDocumentOptions,
} from '../documents/createVariantScopedDocument'
import {VARIANTS_STUDIO_CLIENT_OPTIONS} from '../store/constants'
import {type VariantDocumentBundleId, variantsClient} from '../store/variantsClient'

type DistributiveOmit<Type, Key extends PropertyKey> = Type extends unknown
  ? Omit<Type, Key>
  : never

/**
 * A variant-scoped document version, addressed the way every variant document action expects:
 * the `(publishedId, variantId, bundleId)` triple, never a raw version id (variant version ids
 * carry an opaque server-generated scope hash). `bundleId` is lifted verbatim from the row's
 * `version.bundleId` — `undefined` for the variant-of-published, `'drafts'` for a draft, or the
 * short release id for a release-scoped version.
 *
 * @internal
 */
export interface VariantDocumentTarget {
  publishedId: string
  variantId: string
  bundleId: VariantDocumentBundleId
}

/**
 * @internal
 */
export function useVariantDocumentOperations() {
  const client = useClient(VARIANTS_STUDIO_CLIENT_OPTIONS)

  const createVariantDocument = useCallback<
    (
      options: DistributiveOmit<CreateVariantScopedDocumentOptions, 'client'>,
    ) => Promise<SingleActionResult>
  >(
    (options) =>
      createVariantScopedDocument({
        client,
        ...options,
      }),
    [client],
  )

  // Publishes a variant version into the variant-of-published document (creating or overwriting it)
  // and deletes the source. Only a drafts-scoped source is valid here — release-scoped variants
  // publish with their release. The base published document is never touched.
  const publishVariantDocument = useCallback(
    ({publishedId, variantId, bundleId}: VariantDocumentTarget): Promise<SingleActionResult> =>
      variantsClient(client).action(
        {
          actionType: 'sanity.action.document.variant.publish',
          publishedId,
          variantId,
          // A publish source is never the published bundle; targets are filtered to drafts upstream.
          bundleId: bundleId ?? 'drafts',
        },
        {tag: 'variants.document.publish'},
      ),
    [client],
  )

  // Unpublishes a variant version. `bundleId: undefined` (the variant-of-published) hard-unpublishes
  // now; a release id soft-unpublishes (marker completed when the release runs). `'drafts'` is not a
  // valid target and is filtered out upstream.
  const unpublishVariantDocument = useCallback(
    ({publishedId, variantId, bundleId}: VariantDocumentTarget): Promise<SingleActionResult> =>
      variantsClient(client).action(
        {
          actionType: 'sanity.action.document.variant.unpublish',
          publishedId,
          variantId,
          bundleId,
        },
        {tag: 'variants.document.unpublish', skipCrossDatasetReferenceValidation: true},
      ),
    [client],
  )

  // Deletes the addressed variant version document (the Studio's "discard changes" for drafts- and
  // release-scoped variant versions). Other bundles' variant documents and the base pair are
  // unaffected; discarding the variant-of-published is not allowed (that is unpublish's job).
  const deleteVariantDocument = useCallback(
    ({publishedId, variantId, bundleId}: VariantDocumentTarget): Promise<SingleActionResult> =>
      variantsClient(client).action(
        {
          actionType: 'sanity.action.document.variant.delete',
          publishedId,
          variantId,
          bundleId,
        },
        {tag: 'variants.document.delete'},
      ),
    [client],
  )

  return {
    createVariantDocument,
    publishVariantDocument,
    unpublishVariantDocument,
    deleteVariantDocument,
  }
}
