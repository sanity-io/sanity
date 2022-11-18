import {ArraySchemaType, Path, SchemaType} from '@sanity/types'
import {concat, defer, EMPTY, from, Observable, of} from 'rxjs'
import {catchError, filter, map, mergeMap} from 'rxjs/operators'
import {resolveTypeName} from '@sanity/util/content'
import {FormPatch, set, unset} from '../../patch'
import {ObjectItem} from '../../types'
import {isEmptyItem} from '../../store/utils/isEmptyItem'
import {isNonNullable} from '../../../util'

const getMemberTypeOfItem = (schemaType: ArraySchemaType, item: any): SchemaType | undefined => {
  const itemTypeName = resolveTypeName(item)
  return schemaType.of.find((memberType) => memberType.name === itemTypeName)
}

/**
 * Create patches that shallow merges keys from the given value
 * Used by initial value resolver to retain any properties already added on the item when initial value is done resolving
 * */
function assign(values: Record<string, unknown>, path: Path) {
  return Object.entries(values).map(([key, value]) => set(value, [...path, key]))
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
      const itemPathSegment = {_key: item._key}
      return of(getMemberTypeOfItem(schemaType, item)).pipe(
        mergeMap((memberType) => (memberType ? of(memberType) : EMPTY)),
        mergeMap((memberType) => {
          if (!isEmptyItem(item) || !resolver) {
            return EMPTY
          }
          return concat(
            of({
              type: 'patch' as const,
              patches: [set(true, [itemPathSegment, '_resolvingInitialValue'])],
            }),
            defer(() => resolver(memberType, item)).pipe(
              filter(isNonNullable),
              map((initial) => ({
                type: 'patch' as const,
                patches: assign(initial, [itemPathSegment]),
              })),
              catchError((error) =>
                of({type: 'error' as const, error, item, schemaType: memberType})
              )
            ),
            of({
              type: 'patch' as const,
              patches: [unset([itemPathSegment, '_resolvingInitialValue'])],
            })
          )
        })
      )
    })
  )
}
