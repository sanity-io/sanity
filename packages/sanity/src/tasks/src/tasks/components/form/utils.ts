import {getPublishedId} from 'sanity'

import {type TaskTarget} from '../../types'

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
    documentType: documentType,
    document: {
      _ref: getPublishedId(documentId),
      _type: 'crossDatasetReference',
      _dataset: dataset,
      _projectId: projectId,
      _weak: true,
    },
  }
}
