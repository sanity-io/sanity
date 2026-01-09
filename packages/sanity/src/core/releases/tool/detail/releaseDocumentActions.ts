import {isGoingToUnpublish} from '../../util/isGoingToUnpublish'
import {type BundleDocumentRow} from './ReleaseSummary'
import {type DocumentInRelease} from './useBundleDocuments'

export interface DocumentActionConfig {
  key: 'added' | 'changed' | 'unpublished'
  tone: 'positive' | 'caution' | 'critical'
  translationKey: string
}

export const DOCUMENT_ACTION_CONFIGS: DocumentActionConfig[] = [
  {
    key: 'added',
    tone: 'positive',
    translationKey: 'table-body.action.add',
  },
  {
    key: 'changed',
    tone: 'caution',
    translationKey: 'table-body.action.change',
  },
  {
    key: 'unpublished',
    tone: 'critical',
    translationKey: 'table-body.action.unpublish',
  },
]

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
