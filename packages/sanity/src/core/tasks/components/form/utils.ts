import {isPortableTextTextBlock} from '@sanity/types'

import {getPublishedId} from '../../../util'
import {type TaskDocument, type TaskTarget} from '../../types'

interface GetTargetValueOptions {
  documentId: string
  documentType: string
  dataset: string
  projectId: string
}
export function getTargetValue({
  documentId,
  documentType,
  dataset,
  projectId,
}: GetTargetValueOptions): TaskTarget {
  return {
    documentType,
    document: {
      _ref: getPublishedId(documentId),
      _type: 'crossDatasetReference',
      _dataset: dataset,
      _projectId: projectId,
      _weak: true,
    },
  }
}

/**
 * Finds in the description if there are any mentioned user.
 */
export function getMentionedUsers(description?: TaskDocument['description']): string[] {
  if (!description) return []
  const subscribers: string[] = []
  description?.forEach((block) => {
    if (isPortableTextTextBlock(block)) {
      block.children.forEach((child) => {
        if (
          child._type === 'mention' &&
          typeof child.userId === 'string' &&
          !subscribers.includes(child.userId)
        ) {
          subscribers.push(child.userId)
        }
      })
    }
  })

  return subscribers
}
