import {type SchemaType} from '@sanity/types'

function is(typeName: string, type: SchemaType): boolean {
  return type.name === typeName || Boolean(type.type && is(typeName, type.type))
}

export {is as type}
