import {type ReleaseDocument} from '@sanity/client'

import {getReleaseIdFromReleaseDocumentId} from '../../../releases/util/getReleaseIdFromReleaseDocumentId'
import {isNotArchivedRelease, isReleaseScheduledOrScheduling} from '../../../releases/util/util'
import {getDocumentVersionVariantId} from '../../../util/getDocumentVersionVariant'
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
 */
export function getAvailableBundles({
  variantId,
  releases,
  existingVariants,
}: {
  variantId: string | undefined
  releases: ReadonlyMap<string, ReleaseDocument>
  existingVariants: Variant[]
}): CreateVariantBundleOption[] {
  const existingBundles = new Set<string>()

  for (const {document} of existingVariants) {
    if (getDocumentVersionVariantId(document) === variantId) {
      existingBundles.add(
        document._system.bundleId ?? document._system.release?._ref ?? 'published',
      )
    }
  }

  const options: CreateVariantBundleOption[] = existingBundles.has('drafts')
    ? []
    : [{type: 'drafts'}]

  for (const [releaseId, release] of releases) {
    if (
      release.state !== 'published' &&
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
