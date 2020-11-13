import client from 'part:@sanity/base/client'
import {from as observableFrom} from 'rxjs'
import {map} from 'rxjs/operators'
import {Reference} from './types'
import {ReferenceSchemaType} from '@sanity/types'

const CACHE = {} // todo: use a LRU cache instead (e.g. hashlru or quick-lru)

function resolveRefTypeName(reference: Reference) {
  if (!(reference._ref in CACHE)) {
    CACHE[reference._ref] = client.fetch('*[_id == $id][0]._type', {id: reference._ref})
  }
  return observableFrom(CACHE[reference._ref])
}

export default function resolveRefType(value: Reference, type: ReferenceSchemaType) {
  return resolveRefTypeName(value).pipe(
    map((refTypeName) => type.to.find((toType) => toType.name === refTypeName))
  )
}
