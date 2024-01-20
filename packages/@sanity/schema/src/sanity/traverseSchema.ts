import {traverseSchema, type Visitor} from '../core/traverseSchema'
import coreTypes from './coreTypes'
import {type _FIXME_} from './typedefs'

export function traverseSanitySchema(schemaTypes: _FIXME_[], visitor: Visitor) {
  return traverseSchema(schemaTypes, coreTypes as _FIXME_, visitor)
}
