import {type DocumentSystem} from '@sanity/types'

import {type PerspectiveBundle} from '../../../perspective/types'
import {DOCUMENT_SYSTEM_FIELD} from '../../../preview/constants'
import {isPublishedBundleId} from '../util'
import {
  type DocumentInVariant,
  type DocumentInVariantGroup,
  type DocumentValidationStatus,
  type VariantDocumentVersion,
} from './types'

function getBundleSortOrder(bundleId: PerspectiveBundle | undefined): number {
  if (isPublishedBundleId(bundleId)) {
    return 0
  }

  if (bundleId === 'drafts') {
    return 1
  }

  return 2
}

function compareVariantDocumentVersions(
  left: VariantDocumentVersion,
  right: VariantDocumentVersion,
): number {
  const leftOrder = getBundleSortOrder(left.bundleId)
  const rightOrder = getBundleSortOrder(right.bundleId)

  if (leftOrder !== rightOrder) {
    return leftOrder - rightOrder
  }

  return left.documentId.localeCompare(right.documentId)
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
): DocumentInVariantGroup[] {
  const groups = new Map<string, DocumentInVariant[]>()

  for (const document of documents) {
    const system = document.document[DOCUMENT_SYSTEM_FIELD] as DocumentSystem | undefined
    const groupId = system?.group?._ref

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
      .toSorted(compareVariantDocumentVersions)

    return {
      ...representative,
      groupId,
      versions,
      validation: aggregateValidation(groupDocuments),
    }
  })
}
