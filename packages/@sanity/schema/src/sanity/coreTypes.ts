import {INTERNAL_FORM_DECORATOR} from '../legacy/types/constants'

const coreTypes = [
  {name: 'array', jsonType: 'array', type: 'type'},
  {name: 'block', jsonType: 'object', type: 'type'},
  {name: 'boolean', jsonType: 'boolean', type: 'type'},
  {name: 'datetime', jsonType: 'string', type: 'type'},
  {name: 'date', jsonType: 'string', type: 'type'},
  {name: 'document', jsonType: 'object', type: 'type'},
  {name: 'email', jsonType: 'string', type: 'type'},
  {name: 'file', jsonType: 'object', type: 'type'},
  {name: 'geopoint', jsonType: 'object', type: 'type'},
  {name: 'image', jsonType: 'object', type: 'type'},
  {name: 'number', jsonType: 'number', type: 'type'},
  {name: 'object', jsonType: 'object', type: 'type'},
  {name: 'reference', jsonType: 'object', type: 'type'},
  {name: 'crossDatasetReference', jsonType: 'object', type: 'type'},
  {name: 'globalDocumentReference', jsonType: 'object', type: 'type'},
  {name: 'slug', jsonType: 'object', type: 'type'},
  {name: 'span', jsonType: 'object', type: 'type'},
  {name: 'string', jsonType: 'string', type: 'type'},
  {name: 'telephone', jsonType: 'string', type: 'type'},
  {name: 'text', jsonType: 'string', type: 'type'},
  {name: 'url', jsonType: 'string', type: 'type'},
  {name: INTERNAL_FORM_DECORATOR, jsonType: 'null', type: 'type'},
] as const

export const coreTypeNames = coreTypes.map((t) => t.name)
export default coreTypes
