import {SchemaType} from '@sanity/types'

export default function getEmptyValue(type: SchemaType) {
  switch (type.jsonType) {
    case 'string': {
      return ''
    }
    case 'number': {
      return 0
    }
    case 'boolean': {
      return false
    }
    default:
      return undefined
  }
}
