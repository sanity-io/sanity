import {debounceTime, distinctUntilChanged, map, switchMap} from 'rxjs/operators'

import shallowEquals from 'shallow-equals'
import {combineLatest, pipe} from 'rxjs'
import {useObservable, useAsObservable} from 'react-rx'
import {
  canCreateType,
  canCreateAnyOf,
  canDelete,
  canDiscardDraft,
  canPublish,
  canUnpublish,
  canUpdate,
} from './highlevel'

const INITIAL = {granted: true, reason: '<pending>'}

/**
 * unstable
 * @internal
 */
function useFilteredCreatableTypes(
  typeNames: string[]
): Array<{typeName: string; granted: boolean; reason: string}> | null {
  return useObservable(
    useAsObservable(
      typeNames,
      pipe(
        distinctUntilChanged(shallowEquals),
        debounceTime(10),
        switchMap((types) =>
          combineLatest(
            types.map((type) =>
              canCreateType('dummy-id', type).pipe(
                map((result) => ({
                  ...result,
                  typeName: type,
                }))
              )
            )
          )
        )
      )
    ),
    null
  )
}

/**
 * unstable
 * @internal
 */
function useCanCreateAnyOf(typeNames: string[]): {granted: boolean; reason: string} {
  return useObservable(
    useAsObservable(
      typeNames,
      pipe(
        distinctUntilChanged(shallowEquals),
        debounceTime(10),
        switchMap(() => canCreateAnyOf(typeNames))
      )
    ),
    INITIAL
  )
}

/**
 * unstable
 * @internal
 */
function useCheckDocumentPermission(
  id: string,
  type: string,
  permission: 'update' | 'create' | 'delete' | 'publish' | 'unpublish' | 'discardDraft'
): {granted: boolean; reason: string} {
  return useObservable(
    useAsObservable(
      [id, type, permission] as const,
      pipe(
        distinctUntilChanged(shallowEquals),
        debounceTime(10),
        // eslint-disable-next-line @typescript-eslint/no-shadow
        switchMap(([id, type, permission]) => {
          if (permission === 'update') {
            return canUpdate(id, type)
          }
          if (permission === 'create') {
            return canCreateType(id, type)
          }
          if (permission === 'publish') {
            return canPublish(id, type)
          }
          if (permission === 'delete') {
            return canDelete(id, type)
          }
          if (permission === 'unpublish') {
            return canUnpublish(id, type)
          }
          if (permission === 'discardDraft') {
            return canDiscardDraft(id, type)
          }
          throw new Error(`Unknown permission: "${permission}"`)
        })
      )
    ),
    INITIAL
  )
}

/* eslint-disable camelcase */
export {
  useFilteredCreatableTypes as unstable_useFilteredCreatableTypes,
  useCheckDocumentPermission as unstable_useCheckDocumentPermission,
  useCanCreateAnyOf as unstable_useCanCreateAnyOf,
}
/* eslint-enable camelcase */
