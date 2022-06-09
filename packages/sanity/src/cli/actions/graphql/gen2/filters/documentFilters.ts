import type {InputObjectType} from '../../types'

export function createDocumentFilters(): InputObjectType {
  return {
    name: 'DocumentFilter',
    kind: 'InputObject',
    isConstraintFilter: true,
    fields: [
      {
        fieldName: 'references',
        type: 'ID',
        description: 'All documents referencing the given document ID.',
      },
      {
        fieldName: 'is_draft',
        type: 'Boolean',
        description: 'All documents that are drafts.',
      },
    ],
  }
}
