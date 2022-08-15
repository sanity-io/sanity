import {traverseSchema, type Visitor} from '../core/traverseSchema'
import type {_FIXME_} from './typedefs'
import coreTypes from './coreTypes'

export function traverseSanitySchema(schemaTypes: _FIXME_[], visitor: Visitor) {
  return traverseSchema(schemaTypes, coreTypes as _FIXME_, visitor)
}
