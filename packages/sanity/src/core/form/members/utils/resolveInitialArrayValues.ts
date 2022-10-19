import {ArraySchemaType, SchemaType} from '@sanity/types'
import {concat, defer, EMPTY, from, Observable, of} from 'rxjs'
import {catchError, map, mergeMap} from 'rxjs/operators'
import {resolveTypeName} from '@sanity/util/content'
import {FormPatch, set, unset} from '../../patch'
import {ObjectItem} from '../../types'
import {isEmptyItem} from '../../store/utils/isEmptyItem'

const getMemberTypeOfItem = (schemaType: ArraySchemaType, item: any): SchemaType | undefined => {
  const itemTypeName = resolveTypeName(item)
  return schemaType.of.find((memberType) => memberType.name === itemTypeName)
}

export function resolveInitialArrayValues<T extends ObjectItem>(
  items: T[],
  schemaType: ArraySchemaType,
  resolver: (type: SchemaType, params: Record<string, unknown>) => Promise<T>
): Observable<
  | {type: 'patch'; patches: FormPatch[]}
  | {type: 'error'; error: Error; item: T; schemaType: SchemaType}
> {
  return from(items).pipe(
    mergeMap((item) => {
      const itemKey = {_key: item._key}
      return of(getMemberTypeOfItem(schemaType, item)).pipe(
        mergeMap((memberType) => (memberType ? of(memberType) : EMPTY)),
        mergeMap((memberType) => {
          if (!isEmptyItem(item) || !resolver) {
            return EMPTY
          }
          return concat(
            of({type: 'patch' as const, patches: [set(true, [itemKey, '_resolvingInitialValue'])]}),
            defer(() => resolver(memberType, item)).pipe(
              map((initial) => ({
                type: 'patch' as const,
                patches: [set({...item, ...initial}, [itemKey])],
              })),
              catchError((error) =>
                of({type: 'error' as const, error, item, schemaType: memberType})
              )
            ),
            of({type: 'patch' as const, patches: [unset([itemKey, '_resolvingInitialValue'])]})
          )
        })
      )
    })
  )
}
