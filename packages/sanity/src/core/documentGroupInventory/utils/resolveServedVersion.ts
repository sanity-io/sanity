import {getDefaultVariant} from '../../perspective/getDefaultVariant'
import {type PerspectiveBundle, type PerspectiveContextValue} from '../../perspective/types'
import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {isGoingToUnpublish} from '../../releases/util/isGoingToUnpublish'
import {AGENT_BUNDLE_PREFIX} from '../../store/agent/constants'
import {getTargetDocument} from '../../util/getTargetDocument'
import {type VariantId} from '../../variants/types'

/**
 * The priority at which a version is served for the selected perspective and variant:
 *
 * - `primary`: the version carries the selected variant, or the base variant when none is selected.
 * - `secondary`: the selected variant has no version to serve, so this base variant version is
 *   served in its place.
 *
 * @internal
 */
export type ServedStatus = 'primary' | 'secondary'

/**
 * @internal
 */
export interface ServedVersion {
  id: string
  status: ServedStatus
}

/**
 * Finds the version of a document group that Content Lake serves for the selected perspective and
 * variant. This is the end user's point of view, so it deliberately differs from the version the
 * document editor targets.
 *
 * Each lookup checks the selected bundle, then published. Other bundles in the perspective stack
 * are never considered. The selected variant takes priority over the bundle: a published version of
 * the variant is served before a base version in the selected bundle. Only when the variant has no
 * version in either bundle is the base variant version served, as `secondary`.
 *
 * Live-edit types need no special case: they have no drafts lane, and published is always checked
 * next.
 *
 * Agent bundles are typically only served to editors, rather than end users. When the the agent
 * bundle perspective is active, the nearest published version is instead shown as the served
 * version.
 *
 * Nothing is served while the selected variant's definition is unresolved (loading or missing).
 *
 * @internal
 */
export function resolveServedVersion({
  perspective,
  variantsEnabled,
  versions,
}: {
  perspective: Pick<PerspectiveContextValue, 'bundle' | 'selectedVariantNames' | 'selectedVariants'>
  variantsEnabled: boolean
  versions: VersionInfoDocumentStub[]
}): ServedVersion | undefined {
  const {bundle, selectedVariantNames, selectedVariants} = perspective

  let variantId: VariantId | undefined

  if (variantsEnabled && getDefaultVariant(selectedVariantNames)) {
    const selectedVariant = getDefaultVariant(selectedVariants)

    if (!selectedVariant) {
      return undefined
    }

    variantId = selectedVariant._id
  }

  const bundles: PerspectiveBundle[] =
    bundle === 'published' || bundle.startsWith(AGENT_BUNDLE_PREFIX)
      ? ['published']
      : [bundle, 'published']

  if (variantId) {
    const variantVersion = findInBundles({bundles, variant: variantId, versions})

    if (variantVersion) {
      return toServedVersion(variantVersion, 'primary')
    }
  }

  const base = findInBundles({bundles, variant: undefined, versions})

  if (base) {
    return toServedVersion(base, variantId ? 'secondary' : 'primary')
  }

  return undefined
}

function toServedVersion(
  version: VersionInfoDocumentStub,
  status: ServedStatus,
): ServedVersion | undefined {
  if (isGoingToUnpublish(version)) {
    return undefined
  }

  return {id: version._id, status}
}

function findInBundles({
  bundles,
  variant,
  versions,
}: {
  bundles: PerspectiveBundle[]
  variant: VariantId | undefined
  versions: VersionInfoDocumentStub[]
}): VersionInfoDocumentStub | undefined {
  for (const bundle of bundles) {
    const version = getTargetDocument({bundle, variant, documentVersions: versions})

    if (version) {
      return version
    }
  }

  return undefined
}
