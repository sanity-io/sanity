import {SchemaType} from '@sanity/types'

export function getEmptyValue(type: SchemaType): number | string | boolean {
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
      throw new Error(`Unable to create value from type "${type.jsonType}"`)
  }
}
