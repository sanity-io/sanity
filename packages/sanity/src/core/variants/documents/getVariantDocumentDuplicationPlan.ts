import {type ReleaseDocument} from '@sanity/client'
import {type DocumentSystem, type Schema} from '@sanity/types'

import {DOCUMENT_SYSTEM_FIELD} from '../../preview/constants'
import {isGoingToUnpublish} from '../../releases/util/isGoingToUnpublish'
import {isReleaseScheduledOrScheduling} from '../../releases/util/util'
import {isCardinalityOneRelease} from '../../util/releaseUtils'
import {resolveVersionBundle} from '../tool/detail/releaseLane'
import {type DocumentInVariant} from '../tool/detail/types'

/**
 * A document version to copy into the duplicated variant.
 *
 * @internal
 */
export interface VariantDocumentDuplicate {
  /** The document group the copy belongs to (the published document id). */
  documentGroupId: string
  /** The version document in the original variant whose content is copied. */
  baseId: string
  /** The bundle the copy is created in: `drafts`, `published` (live-edit types only), or a release id. */
  perspective: string
}

/**
 * Why a document version of the original variant is not copied into the duplicate.
 *
 * - `scheduled-release`: its release is scheduled, so no documents can be added to it.
 * - `going-to-unpublish`: it is marked to be unpublished when its release is published; a copy
 *   would publish the content instead.
 *
 * @internal
 */
export type VariantDocumentDuplicateSkipReason = 'scheduled-release' | 'going-to-unpublish'

/**
 * @internal
 */
export interface SkippedVariantDocument {
  document: DocumentInVariant
  reason: VariantDocumentDuplicateSkipReason
  release: ReleaseDocument | undefined
}

/**
 * @internal
 */
export interface VariantDocumentDuplicationPlan {
  toCreate: VariantDocumentDuplicate[]
  skipped: SkippedVariantDocument[]
}

function getGroupId(item: DocumentInVariant): string | undefined {
  const system = item.document[DOCUMENT_SYSTEM_FIELD] as DocumentSystem | undefined
  return system?.group?._ref
}

/**
 * A scheduled draft is a release holding exactly one document, so another document cannot be added
 * to it either.
 */
function cannotAddDocuments(release: ReleaseDocument): boolean {
  return isReleaseScheduledOrScheduling(release) || isCardinalityOneRelease(release)
}

/**
 * Decides which document versions of a variant are copied when the variant is duplicated, and into
 * which bundle of the new variant.
 *
 * - Draft versions are copied as drafts.
 * - Published versions are copied as drafts, so nothing in the new variant goes live until it is
 *   published. A document that also has a draft version in the variant only gets the draft copied,
 *   since a document has a single draft. Live-edit types have no drafts, so their published versions
 *   are copied as published.
 * - Release versions are copied into the same release, unless the release can no longer take
 *   documents or the version is marked to be unpublished. Those are returned in `skipped`.
 *
 * @internal
 */
export function getVariantDocumentDuplicationPlan({
  documents,
  releasesById,
  schema,
}: {
  documents: DocumentInVariant[]
  releasesById: Map<string, ReleaseDocument>
  schema: Schema
}): VariantDocumentDuplicationPlan {
  const groupsWithDraft = new Set<string>()
  for (const item of documents) {
    const groupId = getGroupId(item)
    if (groupId && item.version.bundleId === 'drafts') {
      groupsWithDraft.add(groupId)
    }
  }

  const toCreate: VariantDocumentDuplicate[] = []
  const skipped: SkippedVariantDocument[] = []

  for (const item of documents) {
    const documentGroupId = getGroupId(item)
    if (!documentGroupId) {
      continue
    }

    const baseId = item.document._id
    const {bundleId} = item.version

    if (bundleId === undefined || bundleId === 'published') {
      if (schema.get(item.document._type)?.liveEdit) {
        toCreate.push({documentGroupId, baseId, perspective: 'published'})
      } else if (!groupsWithDraft.has(documentGroupId)) {
        toCreate.push({documentGroupId, baseId, perspective: 'drafts'})
      }
      continue
    }

    if (bundleId === 'drafts') {
      toCreate.push({documentGroupId, baseId, perspective: 'drafts'})
      continue
    }

    const {release} = resolveVersionBundle(item.version, releasesById)

    if (release && cannotAddDocuments(release)) {
      skipped.push({document: item, reason: 'scheduled-release', release})
      continue
    }

    if (isGoingToUnpublish(item.document)) {
      skipped.push({document: item, reason: 'going-to-unpublish', release})
      continue
    }

    toCreate.push({documentGroupId, baseId, perspective: bundleId})
  }

  return {toCreate, skipped}
}
