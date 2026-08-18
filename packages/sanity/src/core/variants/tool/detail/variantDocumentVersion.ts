import {type SanityDocument} from '@sanity/client'
import {type DocumentSystem} from '@sanity/types'

import {DOCUMENT_SYSTEM_FIELD} from '../../../preview/constants'
import {type VariantDocumentVersion} from './types'

/**
 * @internal
 */
export function toVariantDocumentVersion(document: SanityDocument): VariantDocumentVersion | null {
  const system = document[DOCUMENT_SYSTEM_FIELD] as DocumentSystem | undefined

  if (!system?.group?._ref) {
    return null
  }

  return {
    documentId: document._id,
    bundleId: system.bundleId ?? undefined,
    releaseRef: system.release?._ref ?? null,
    updatedAt: document._updatedAt ?? '',
  }
}
