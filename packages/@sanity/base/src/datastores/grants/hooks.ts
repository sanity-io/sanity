import {debounceTime, distinctUntilChanged, switchMap} from 'rxjs/operators'

import {SanityDocument} from '@sanity/types'
import shallowEquals from 'shallow-equals'
import {pipe} from 'rxjs'
import {useObservable, useAsObservable, useMemoObservable} from 'react-rx'
import {
  // eslint-disable-next-line camelcase
  canCreateType as old_canCreateType,
  canCreateAnyOf,
  canDelete,
  canDiscardDraft,
  // eslint-disable-next-line camelcase
  canPublish as old_canPublish,
  canUnpublish,
  // eslint-disable-next-line camelcase
  canUpdate as old_canUpdate,
} from './highlevel'

import {canCreateType, canPublish, canUpdate} from './documentPair'

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

// this is the new hook to check for permissions. It only needs the document and does not resolve the initial value templates
export function useCheckDocumentPermissions(
  document: Partial<SanityDocument>,
  permission: 'update' | 'create' | 'delete' | 'publish' | 'unpublish' | 'discardDraft'
) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useMemoObservable(() => {
    if (permission === 'update') {
      return canUpdate(document)
    }
    if (permission === 'create') {
      return canCreateType(document)
    }
    if (permission === 'publish') {
      return canPublish(document)
    }
    throw new Error(`Unknown permission: "${permission}"`)
  }, [document, permission])
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
            return old_canUpdate(id, type)
          }
          if (permission === 'create') {
            return old_canCreateType(id, type)
          }
          if (permission === 'publish') {
            return old_canPublish(id, type)
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
