import {from as observableFrom, Observable} from 'rxjs'
import {map} from 'rxjs/operators'
import {Reference, ReferenceSchemaType, SchemaType} from '@sanity/types'
import {versionedClient} from '../../client/versionedClient'

const CACHE: Record<string, Promise<string>> = Object.create(null) // todo: use a LRU cache instead (e.g. hashlru or quick-lru)

function resolveRefTypeName(reference: Reference): Observable<string> {
  if (!(reference._ref in CACHE)) {
    CACHE[reference._ref] = versionedClient.fetch('*[_id == $id][0]._type', {id: reference._ref})
  }
  return observableFrom(CACHE[reference._ref])
}

export default function resolveRefType(
  value: Reference,
  type: ReferenceSchemaType
): Observable<SchemaType | undefined> {
  return resolveRefTypeName(value).pipe(
    map((refTypeName) => type.to.find((toType) => toType.name === refTypeName))
  )
}
