import {type SanityDocument} from '@sanity/types'

/**
 * The current lane's stubs, narrowed to the published sibling the events inspector
 * needs. Same shape as the `siblings` field on a resolved target document state.
 */
export interface PublishedComparisonSiblings {
  published?: {_system?: {scopeId?: string}}
}

/**
 * Scope id of this lane's published sibling, used to check out the sibling pair
 * so a variant-of-published document arrives in `editState.version`. `undefined`
 * for the base published document (no scope id) and when siblings are unresolved.
 *
 * @internal
 */
export function getPublishedSiblingScopeId(
  siblings: PublishedComparisonSiblings | undefined,
): string | undefined {
  return siblings?.published?._system?.scopeId
}

/**
 * Resolves the published document this lane should compare against in the events
 * inspector fallback ("Comparing with published").
 *
 * "Published" means this lane's published sibling, not the group's published document.
 * A scoped stub (variant-of-published) is checked out as a pair whose document arrives
 * in `version`; a default published (no scope id) is `editState.published`.
 *
 * Returns `null` when this lane has never been published, or the sibling pair has not
 * loaded yet. While siblings are still resolving (`undefined`), falls back to
 * `published` so the default pair does not wait on version stubs.
 *
 * @internal
 */
export function getPublishedComparisonBase({
  siblings,
  siblingVersion,
  published,
}: {
  siblings: PublishedComparisonSiblings | undefined
  siblingVersion: SanityDocument | null | undefined
  published: SanityDocument | null | undefined
}): SanityDocument | null {
  const publishedStub = siblings?.published
  const siblingScopeId = getPublishedSiblingScopeId(siblings)

  if (siblingScopeId) {
    return siblingVersion ?? null
  }

  if (publishedStub || siblings === undefined) {
    return published ?? null
  }

  return null
}
