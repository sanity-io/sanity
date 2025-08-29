import {type SanityDocument} from '@sanity/client'

import {isGoingToUnpublish} from '../../util/isGoingToUnpublish'

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
  document: Partial<SanityDocument>,
): DocumentActionConfig['key'] | null {
  const willBeUnpublished = isGoingToUnpublish(document)
  if (willBeUnpublished) {
    return 'unpublished'
  }

  if (document.hasPublished) {
    return 'changed'
  }

  return 'added'
}

export function getReleaseDocumentActionConfig(
  actionType: DocumentActionConfig['key'],
): DocumentActionConfig | undefined {
  return DOCUMENT_ACTION_CONFIGS.find(({key}) => key === actionType)
}
