import {debounceTime, distinctUntilChanged, switchMap} from 'rxjs/operators'

import {SanityDocument} from '@sanity/types'
import shallowEquals from 'shallow-equals'
import {pipe} from 'rxjs'
import {useObservable, useAsObservable, useMemoObservable} from 'react-rx'
import {
  canCreateType,
  canCreateAnyOf,
  canDelete,
  canDiscardDraft,
  canPublish,
  canUnpublish,
  canUpdate,
} from './highlevel'

import {
  canCreateType as canCreateType2,
  canDelete as canDelete2,
  canDiscardDraft as canDiscardDraft2,
  canPublish as canPublish2,
  canUnpublish as canUnpublish2,
  canUpdate as canUpdate2,
} from './documentPair'

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
export function useCheckDocumentPermission_temp(
  document: Partial<SanityDocument>,
  permission: 'update' | 'create' | 'delete' | 'publish' | 'unpublish' | 'discardDraft'
) {
  return useMemoObservable(() => {
    if (permission === 'update') {
      return canUpdate2(document)
    }
    if (permission === 'create') {
      return canCreateType2(document)
    }
    if (permission === 'publish') {
      return canPublish2(document)
    }
    if (permission === 'delete') {
      return canDelete2(document)
    }
    if (permission === 'unpublish') {
      return canUnpublish2(document)
    }
    if (permission === 'discardDraft') {
      return canDiscardDraft2(document)
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
