import {type SanityClient} from '@sanity/client'
import {getPublishedId, getVersionId} from '@sanity/client/csm'
import {type DocumentSystem, type SanityDocument, type SanityDocumentLike} from '@sanity/types'
import {customAlphabet} from 'nanoid'

import {type ReleaseId, type TargetPerspective} from '../../perspective/types'
import {DOCUMENT_SYSTEM_FIELD} from '../../preview/constants'
import {type SystemVariant} from '../types'
import {getBundleIdFromPerspective} from './getBundleIdFromPerspective'

const createScopeIdSuffix = customAlphabet(
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  8,
)

/**
 * @internal temporal.
 * Will be replaced with the new document system API when available.
 */
function buildVariantDocumentSystem(options: {
  publishedId: string
  variant: SystemVariant
  scopeId: string
  selectedPerspectiveName: ReleaseId | 'published' | undefined
  selectedPerspective: TargetPerspective
}): DocumentSystem {
  const {publishedId, variant, scopeId, selectedPerspective} = options
  const {bundleId, release} = getBundleIdFromPerspective(selectedPerspective)

  return {
    bundleId,
    release,
    variant: {_type: 'reference', _ref: variant._id, _weak: true},
    group: {_type: 'reference', _ref: publishedId, _weak: true},
    scopeId,
  }
}

/**
 * Creates a variant-scoped version document. Replace this implementation with the variants
 * document action API when available.
 *
 * @internal
 */
export async function createVariantScopedDocument({
  client,
  document,
  variant,
  selectedPerspectiveName,
  selectedPerspective,
}: {
  client: SanityClient
  /** Source document whose fields are copied into the new variant-scoped version. */
  document: SanityDocumentLike
  variant: SystemVariant
  selectedPerspectiveName: 'published' | ReleaseId | undefined
  selectedPerspective: TargetPerspective
}): Promise<SanityDocument> {
  if (!document._id) {
    throw new Error('Source document must have an _id')
  }

  const publishedId = getPublishedId(document._id)
  const scopeId = createScopeIdSuffix()
  const versionId = getVersionId(publishedId, scopeId)
  const system = buildVariantDocumentSystem({
    publishedId,
    variant,
    scopeId,
    selectedPerspectiveName,
    selectedPerspective,
  })

  const documentPayload = {
    ...document,
    _id: versionId,
    [DOCUMENT_SYSTEM_FIELD]: system,
    _rev: undefined,
    _createdAt: undefined,
    _updatedAt: undefined,
  }

  return client.create(documentPayload, {autoGenerateArrayKeys: true})
}
