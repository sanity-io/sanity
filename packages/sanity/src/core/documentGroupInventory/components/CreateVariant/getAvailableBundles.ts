import {type ReleaseDocument} from '@sanity/client'

import {getReleaseIdFromReleaseDocumentId} from '../../../releases/util/getReleaseIdFromReleaseDocumentId'
import {isNotArchivedRelease, isReleaseScheduledOrScheduling} from '../../../releases/util/util'
import {getDocumentVersionVariantId} from '../../../util/getDocumentVersionVariant'
import {isCardinalityOneRelease} from '../../../util/releaseUtils'
import {type Variant} from '../../machines/selectionMachine'
import {type VariantCreationBundle} from '../../machines/variantCreationMachine'

export type CreateVariantBundleOption =
  | {type: 'drafts'}
  | {type: 'release'; releaseId: string; release: ReleaseDocument}

/**
 * The bundles a variant can be created in: drafts, then every open release,
 * leaving out the ones the document group already holds that variant in.
 *
 * @param releases - The releases, keyed by release document id.
 * @param targetsPublished - Whether the drafts option creates a published version instead (drafts
 * are off in the workspace): it is then left out when the variant already has a published version.
 */
export function getAvailableBundles({
  variantId,
  releases,
  existingVariants,
  targetsPublished = false,
}: {
  variantId: string | undefined
  releases: ReadonlyMap<string, ReleaseDocument>
  existingVariants: Variant[]
  targetsPublished?: boolean
}): CreateVariantBundleOption[] {
  const existingBundles = new Set<string>()

  for (const {document} of existingVariants) {
    if (getDocumentVersionVariantId(document) === variantId) {
      existingBundles.add(
        document._system.bundleId ?? document._system.release?._ref ?? 'published',
      )
    }
  }

  const options: CreateVariantBundleOption[] = existingBundles.has(
    targetsPublished ? 'published' : 'drafts',
  )
    ? []
    : [{type: 'drafts'}]

  for (const [releaseId, release] of releases) {
    if (
      release.state !== 'published' &&
      // A scheduled draft holds one document: it never takes a variant.
      !isCardinalityOneRelease(release) &&
      isNotArchivedRelease(release) &&
      !isReleaseScheduledOrScheduling(release) &&
      !existingBundles.has(getReleaseIdFromReleaseDocumentId(release._id))
    ) {
      options.push({type: 'release', releaseId, release})
    }
  }

  return options
}

export function getBundleKey(bundle: VariantCreationBundle): string {
  return bundle.type === 'drafts' ? 'drafts' : bundle.releaseId
}
