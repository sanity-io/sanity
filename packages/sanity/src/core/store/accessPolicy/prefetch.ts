import {type SanityClient} from '@sanity/client'
import {type SanityDocumentLike} from '@sanity/types'

import {enqueueAssetAccessPolicyFetch} from './fetch'
import {getMediaLibraryRef, type MediaLibraryRef} from './refs'

const MAX_REFS = 200

/**
 * Recursively collect Media Library refs from arbitrary document values.
 * Collects an arbitrary max number of refs to avoid runaway traversal.
 */
function collectRefs(
  value: unknown,
  refs: Set<MediaLibraryRef>,
  visited: WeakSet<object>,
  depth: number,
): void {
  if (!value || refs.size >= MAX_REFS) {
    return
  }

  if (typeof value === 'string') {
    const mediaRef = getMediaLibraryRef(value)
    if (mediaRef) {
      refs.add(mediaRef)
    }
    return
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectRefs(item, refs, visited, depth + 1)
    }
    return
  }

  if (typeof value !== 'object' || visited.has(value)) {
    return
  }

  visited.add(value)

  const mediaRef = getMediaLibraryRef(value)
  if (mediaRef) {
    refs.add(mediaRef)
  }

  for (const childValue of Object.values(value)) {
    collectRefs(childValue, refs, visited, depth + 1)
  }
}

/**
 * Build a deduped set of Media Library refs from one or more documents.
 */
function collectRefsFromDocuments(
  values: SanityDocumentLike | SanityDocumentLike[],
): Set<MediaLibraryRef> {
  const refs = new Set<MediaLibraryRef>()
  const documents = Array.isArray(values) ? values : [values]

  for (const doc of documents) {
    if (!doc) continue
    collectRefs(doc, refs, new WeakSet(), 0)
  }

  return refs
}

/**
 * Prefetch asset access policies for the provided documents by collecting their
 * Media Library refs and enqueueing fetches for each. This is intended to be
 * called from list views to warm the cache before individual assets are rendered.
 *
 * @internal
 */
export function prefetchAssetAccessPolicies(
  values: SanityDocumentLike | SanityDocumentLike[],
  client: SanityClient,
): void {
  const refs = collectRefsFromDocuments(values)

  for (const ref of refs) {
    enqueueAssetAccessPolicyFetch(ref, client).catch(() => {
      // Failing shouldn't block anything
    })
  }
}
