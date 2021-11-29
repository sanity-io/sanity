import type {Observable} from 'rxjs'
import {from as observableFrom} from 'rxjs'
import {map} from 'rxjs/operators'
import type {Reference, ReferenceSchemaType, SchemaType} from '@sanity/types'
import {versionedClient} from '../../client/versionedClient'
import {InsufficientPermissionsError} from '../constants'

// todo: use a LRU cache instead (e.g. hashlru or quick-lru)
const CACHE: Record<string, Promise<string | null>> = Object.create(null)

function resolveRefTypeName(reference: Reference): Observable<string | null> {
  if (!(reference._ref in CACHE)) {
    CACHE[reference._ref] = versionedClient.fetch(
      '*[_id == $id][0]._type',
      {id: reference._ref},
      {tag: 'preview.resolve-ref-type'}
    )
  }
  return observableFrom(CACHE[reference._ref])
}

export default function resolveRefType(
  value: Reference,
  type: ReferenceSchemaType
): Observable<SchemaType | undefined> {
  return resolveRefTypeName(value).pipe(
    map((refTypeName) => {
      if (!refTypeName && !type.weak) {
        throw new InsufficientPermissionsError(
          `Could not resolve _type ${refTypeName} and the reference was marked as weak.`
        )
      }

      return type.to.find((toType) => toType.name === refTypeName)
    })
  )
}
