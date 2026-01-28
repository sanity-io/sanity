import {isGoingToUnpublish} from '../../util/isGoingToUnpublish'
import {type BundleDocumentRow} from './ReleaseSummary'
import {type DocumentInRelease} from './useBundleDocuments'

export type DocumentFilterType = 'all' | 'added' | 'changed' | 'unpublished' | 'errors'

export interface DocumentActionConfig {
  key: 'added' | 'changed' | 'unpublished'
  tone: 'positive' | 'caution' | 'critical'
  labelKey: string
}

export interface FilterTabConfig {
  key: DocumentFilterType
  labelKey: string
  tone: 'default' | 'positive' | 'caution' | 'critical'
}

export const DOCUMENT_ACTION_CONFIGS: DocumentActionConfig[] = [
  {
    key: 'added',
    tone: 'positive',
    labelKey: 'table-body.action.add',
  },
  {
    key: 'changed',
    tone: 'caution',
    labelKey: 'table-body.action.change',
  },
  {
    key: 'unpublished',
    tone: 'critical',
    labelKey: 'table-body.action.unpublish',
  },
]

export const FILTER_TAB_CONFIGS: FilterTabConfig[] = [
  {key: 'all', labelKey: 'filter-tab.all', tone: 'default'},
  ...DOCUMENT_ACTION_CONFIGS,
  {key: 'errors', labelKey: 'filter-tab.errors', tone: 'critical'},
]

export type ActionCounts = Record<'added' | 'changed' | 'unpublished' | 'errors', number>

/**
 * Counts documents by their action type and validation errors
 */
export function countDocumentsByAction(
  documents: (DocumentInRelease | BundleDocumentRow)[],
): ActionCounts {
  return documents.reduce<ActionCounts>(
    (acc, doc) => {
      const actionType = getDocumentActionType(doc)
      if (actionType) {
        acc[actionType]++
      }
      if (doc.validation.hasError && !doc.isPending) {
        acc.errors++
      }
      return acc
    },
    {added: 0, changed: 0, unpublished: 0, errors: 0},
  )
}

/**
 * Checks if a document matches the given filter type
 */
export function documentMatchesFilter(
  doc: DocumentInRelease | BundleDocumentRow,
  filter: DocumentFilterType,
): boolean {
  if (filter === 'all') return true
  if (filter === 'errors') return doc.validation.hasError && !doc.isPending
  return getDocumentActionType(doc) === filter
}

/**
 * Determines the action type for a document based on its state
 */
export function getDocumentActionType(
  document: DocumentInRelease | BundleDocumentRow,
): DocumentActionConfig['key'] | null {
  if (!document.document || document.isPending) {
    return null
  }

  const willBeUnpublished = isGoingToUnpublish(document.document)
  if (willBeUnpublished) {
    return 'unpublished'
  }

  if (document.document.publishedDocumentExists) {
    return 'changed'
  }

  return 'added'
}

export function getReleaseDocumentActionConfig(
  actionType: DocumentActionConfig['key'],
): DocumentActionConfig | undefined {
  return DOCUMENT_ACTION_CONFIGS.find(({key}) => key === actionType)
}
