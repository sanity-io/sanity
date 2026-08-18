import {isPortableTextTextBlock} from '@sanity/types'

import {getPublishedId, getVersionFromId, getVersionId} from '../../../util/draftUtils'
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
    documentVersionId: getVersionFromId(documentId),
  }
}

/**
 * The id of the document a task target points at: the version id when the task was created for
 * a version document (release or variant), otherwise the published id stored in the reference.
 * Matches the id shape of the tasks' active document, which keeps version ids as-is.
 */
export function getTargetDocumentId(target: TaskTarget | undefined): string | undefined {
  const publishedId = target?.document?._ref
  if (!publishedId) return undefined
  return target.documentVersionId
    ? getVersionId(publishedId, target.documentVersionId)
    : publishedId
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
