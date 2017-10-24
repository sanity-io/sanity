// @flow
import traverseSchema from '../core/traverseSchema'
import coreTypes from './coreTypes'

export default function traverseSanitySchema(schemaTypes: Array<any>, visitor) {
  return traverseSchema(schemaTypes, coreTypes, visitor)
}
