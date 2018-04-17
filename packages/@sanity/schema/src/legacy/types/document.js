import {ObjectType} from './object'

const DOCUMENT_CORE = {
  name: 'document',
  type: null,
  jsonType: 'object'
}

export const DocumentType = {
  get() {
    return DOCUMENT_CORE
  },
  extend(subTypeDef, createMemberType) {
    return ObjectType.extend(
      {
        ...subTypeDef,
        draft: subTypeDef.draft !== false
      },
      createMemberType
    )
  }
}
