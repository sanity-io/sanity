import {type PerspectiveBundle} from '../../../perspective/types'
import {getReleaseIdFromReleaseDocumentId} from '../../../releases/util/getReleaseIdFromReleaseDocumentId'
import {
  type DocumentInVariant,
  type DocumentInVariantGroup,
  type DocumentValidationStatus,
  type VariantDocumentVersion,
} from './types'
import {getDocumentGroupId} from './variantDocumentVersion'

const BUNDLE_SORT_ORDER: Record<string, number> = {
  $published: 0,
  drafts: 1,
}

/**
 * @internal
 */
export function compareVariantDocumentVersions(
  left: VariantDocumentVersion,
  right: VariantDocumentVersion,
  getReleaseTitle: (releaseRef: string) => string,
): number {
  const leftOrder = getBundleSortOrder(left.bundleId)
  const rightOrder = getBundleSortOrder(right.bundleId)

  if (leftOrder !== rightOrder) {
    return leftOrder - rightOrder
  }

  if (isReleaseBundle(left.bundleId) && isReleaseBundle(right.bundleId)) {
    const leftTitle = left.releaseRef ? getReleaseTitle(left.releaseRef) : left.bundleId
    const rightTitle = right.releaseRef ? getReleaseTitle(right.releaseRef) : right.bundleId

    return leftTitle.localeCompare(rightTitle)
  }

  return left.documentId.localeCompare(right.documentId)
}

function getBundleSortOrder(bundleId: PerspectiveBundle): number {
  return BUNDLE_SORT_ORDER[bundleId] ?? 2
}

function isReleaseBundle(bundleId: PerspectiveBundle): boolean {
  return bundleId !== '$published' && bundleId !== 'drafts'
}

function pickRepresentativeDocument(documents: DocumentInVariant[]): DocumentInVariant {
  return documents.reduce((latest, current) => {
    const latestUpdatedAt = latest.document._updatedAt ?? ''
    const currentUpdatedAt = current.document._updatedAt ?? ''

    return currentUpdatedAt > latestUpdatedAt ? current : latest
  })
}

function aggregateValidation(documents: DocumentInVariant[]): DocumentValidationStatus {
  const representative = pickRepresentativeDocument(documents)

  return {
    isValidating: documents.some((document) => document.validation.isValidating),
    validation: documents.flatMap((document) => document.validation.validation),
    revision: representative.validation.revision,
    hasError: documents.some((document) => document.validation.hasError),
  }
}

/**
 * Groups flat variant document versions into one row per document group.
 *
 * @internal
 */
export function groupVariantDocumentsByGroup(
  documents: DocumentInVariant[],
  getReleaseTitle: (releaseRef: string) => string = defaultReleaseTitle,
): DocumentInVariantGroup[] {
  const groups = new Map<string, DocumentInVariant[]>()

  for (const document of documents) {
    const groupId = getDocumentGroupId(document.document)

    if (!groupId) {
      continue
    }

    const existingGroup = groups.get(groupId)

    if (existingGroup) {
      existingGroup.push(document)
    } else {
      groups.set(groupId, [document])
    }
  }

  return Array.from(groups.entries()).map(([groupId, groupDocuments]) => {
    const representative = pickRepresentativeDocument(groupDocuments)
    const versions = groupDocuments
      .map((item) => item.version)
      .toSorted((left, right) => compareVariantDocumentVersions(left, right, getReleaseTitle))

    return {
      ...representative,
      groupId,
      versions,
      validation: aggregateValidation(groupDocuments),
    }
  })
}

function defaultReleaseTitle(releaseRef: string): string {
  return getReleaseIdFromReleaseDocumentId(releaseRef)
}
