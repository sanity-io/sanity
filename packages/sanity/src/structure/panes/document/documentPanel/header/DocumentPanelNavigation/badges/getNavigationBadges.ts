import {
  getDocumentVersionVariantId,
  isAgentBundleName,
  isDraftVersion,
  isPublishedVersion,
  isReleaseVersion,
  type VersionInfoDocumentStub,
} from 'sanity'

/** @internal */
export interface NavigationBadgesState {
  /** The variant has a published version. */
  hasPublished: boolean
  /** The variant has a draft. */
  hasDraft: boolean
  /** Ids of the releases the variant has a version in, in the order the versions came. */
  releaseIds: string[]
  /** Agent bundles the variant has a version in. */
  agentBundleIds: string[]
}

/**
 * The bundles a variant of the document has a version in. `variantId` is the variant document id
 * (`_.variants.<name>`), or `undefined` for Default, which matches the versions outside any
 * variant. Versions are classified by `_system`: variant versions have opaque ids.
 *
 * @internal
 */
export function getNavigationBadges(options: {
  versions: VersionInfoDocumentStub[]
  variantId: string | undefined
}): NavigationBadgesState {
  const {versions, variantId} = options
  const state: NavigationBadgesState = {
    hasPublished: false,
    hasDraft: false,
    releaseIds: [],
    agentBundleIds: [],
  }

  for (const version of versions) {
    if (getDocumentVersionVariantId(version) !== variantId) continue

    const bundleId = version._system.bundleId
    if (isReleaseVersion(version)) {
      if (bundleId && !state.releaseIds.includes(bundleId)) state.releaseIds.push(bundleId)
    } else if (isDraftVersion(version)) {
      state.hasDraft = true
    } else if (isPublishedVersion(version)) {
      state.hasPublished = true
    } else if (
      isAgentBundleName(bundleId) &&
      bundleId &&
      !state.agentBundleIds.includes(bundleId)
    ) {
      state.agentBundleIds.push(bundleId)
    }
  }

  return state
}
