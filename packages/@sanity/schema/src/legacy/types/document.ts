import {ObjectType} from './object'

const DOCUMENT_CORE = {
  name: 'document',
  title: 'Document',
  type: null,
  jsonType: 'object',
}

export const DocumentType = {
  get() {
    return DOCUMENT_CORE
  },
  extend: ObjectType.extend,
}
