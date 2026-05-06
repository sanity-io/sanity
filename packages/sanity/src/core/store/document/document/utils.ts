import {type SanityClient} from '@sanity/client'

import {type DocumentTarget} from './types'

type MemoizeKeyPart = boolean | number | string | null | undefined

// Cache key for document-scoped target resolution; pair keys are id-pair based, while this
// needs to preserve the selected version and variant context before resolution.
export function getTargetKey(target: DocumentTarget): string {
  return `${target.baseId}:${target.bundleId}:${target.variantId ?? ''}`
}

// Shared cache key for document-scoped memoizers. Most document APIs are scoped by
// the resolved document id; unresolved target memoizers can pass bundle/variant as parts.
export function getDocumentMemoizeKey(
  client: SanityClient | undefined,
  documentId: string,
  ...parts: MemoizeKeyPart[]
): string {
  const config = client?.config()
  return JSON.stringify([
    config?.dataset ?? '',
    config?.projectId ?? '',
    documentId,
    ...parts.map((part) => part ?? ''),
  ])
}
