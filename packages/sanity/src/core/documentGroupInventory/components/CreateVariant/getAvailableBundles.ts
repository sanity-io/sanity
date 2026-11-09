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
 * A live-edit document has no drafts, so a version of its default variant cannot be created in
 * drafts. A variant still can: the inventory creates it as a published variant instead.
 *
 * @param releases - The releases, keyed by release document id.
 */
export function getAvailableBundles({
  variantId,
  liveEdit,
  releases,
  existingVariants,
}: {
  variantId: string | undefined
  liveEdit: boolean
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

  const offersDrafts =
    !existingBundles.has('drafts') && !(liveEdit && typeof variantId === 'undefined')

  const options: CreateVariantBundleOption[] = offersDrafts ? [{type: 'drafts'}] : []

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
