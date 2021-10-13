import {debounceTime, distinctUntilChanged, switchMap} from 'rxjs/operators'

import shallowEquals from 'shallow-equals'
import {pipe} from 'rxjs'
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

// eslint-disable-next-line camelcase
export function unstable_useCanCreateAnyOf(typeNames: string[]) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useObservable(
    // eslint-disable-next-line react-hooks/rules-of-hooks
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

// eslint-disable-next-line camelcase
export function unstable_useCheckDocumentPermission(
  id: string,
  type: string,
  permission: 'update' | 'create' | 'delete' | 'publish' | 'unpublish' | 'discardDraft'
) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useObservable(
    // eslint-disable-next-line react-hooks/rules-of-hooks
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
