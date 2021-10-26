import {Observable} from 'rxjs'
import {map} from 'rxjs/operators'
import {Reference, ReferenceSchemaType, SchemaType} from '@sanity/types'
import {observePaths} from '../'

export function observeDocumentTypeForId(id: string): Observable<string | undefined> {
  return observePaths(id, ['_type']).pipe(map((res) => res?._type as string | undefined))
}

export default function resolveRefType(
  value: Reference,
  type: ReferenceSchemaType
): Observable<SchemaType | undefined> {
  return resolveDocumentTypeForId(value._ref).pipe(
    map((refTypeName) => {
      // if (!refTypeName && !type.weak) {
      //   throw new InsufficientPermissionsError(
      //     `Could not resolve _type ${refTypeName} and the reference was marked as weak.`
      //   )
      // }

      return type.to.find((toType) => toType.name === refTypeName)
    })
  )
}
