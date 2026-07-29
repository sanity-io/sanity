import {type SingleActionResult} from '@sanity/client'
import {getDraftId, getPublishedId} from '@sanity/client/csm'
import {uuid} from '@sanity/uuid'
import {useCallback} from 'react'

import {useClient} from '../../hooks/useClient'
import {type TargetPerspective} from '../../perspective/types'
import {createVariantScopedDocument} from '../documents/createVariantScopedDocument'
import {VARIANTS_STUDIO_CLIENT_OPTIONS} from '../store/constants'
import {type VariantDocumentBundleId, variantsClient} from '../store/variantsClient'
import {type SystemVariant} from '../types'

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

  const createVariantDocument = useCallback(
    async (options: {
      baseId: string
      baseRevisionId?: string
      variant: SystemVariant
      selectedPerspective: TargetPerspective
    }) => {
      await createVariantScopedDocument({
        client,
        ...options,
      })
    },
    [client],
  )

  // Creates a brand-new document of `type` personalized into the variant. Variant version ids are
  // opaque server hashes, so a version cannot be minted from scratch client-side (see
  // variants/EDITING.md): instead mint a base draft, then personalize it via the FromBase create.
  // Returns the new document's published id so the caller can navigate into its editor (a freshly
  // created document is empty and must be authored, unlike personalizing an existing one).
  const createNewVariantDocument = useCallback(
    async (options: {
      type: string
      variant: SystemVariant
      selectedPerspective: TargetPerspective
    }): Promise<{publishedId: string}> => {
      const draftId = getDraftId(uuid())
      await client.createIfNotExists({_id: draftId, _type: options.type})
      await createVariantScopedDocument({
        client,
        baseId: draftId,
        variant: options.variant,
        selectedPerspective: options.selectedPerspective,
      })
      return {publishedId: getPublishedId(draftId)}
    },
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
    createNewVariantDocument,
    publishVariantDocument,
    unpublishVariantDocument,
    deleteVariantDocument,
  }
}
