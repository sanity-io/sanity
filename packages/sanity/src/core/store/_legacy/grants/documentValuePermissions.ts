import {isEqual} from 'lodash'
import {useEffect, useReducer, useRef} from 'react'
import {distinctUntilChanged, type Observable, type Subscription} from 'rxjs'

import {type LoadingTuple, type PartialExcept} from '../../../util'
import {useGrantsStore} from '../datastores'
import {type DocumentValuePermission, type GrantsStore, type PermissionCheckResult} from './types'

/** @internal */
export interface DocumentValuePermissionsOptions {
  grantsStore: GrantsStore
  document: Record<string, unknown>
  permission: DocumentValuePermission
}

/**
 * Gets permissions based on the value of the document passed into the hook
 * (stateless).
 *
 * Note: this is a lower-level API (compared to `useDocumentPairPermissions`)
 * that is _not_ draft-model aware.
 *
 * As a consequence, the operations it accepts are also low-level. (e.g.
 * `'publish'` permissions can't be determined with this API). This is because
 * it's not possible to tell if a user can do high-level document pair
 * operations on document using only one document value.
 *
 * For example, in order to determine if a user can publish, the current value
 * of the published document needs to be pulled and checked against the user's
 * grants. If there are no matching grants, then it fails the pre-condition and
 * no operation is allowed regardless of the given document.
 *
 * @see useDocumentPairPermissions
 *
 * @internal
 */
export function getDocumentValuePermissions({
  grantsStore,
  document,
  permission,
}: DocumentValuePermissionsOptions): Observable<PermissionCheckResult> {
  const {checkDocumentPermission} = grantsStore

  return checkDocumentPermission(permission, document)
}

const INITIAL_STATE: LoadingTuple<PermissionCheckResult | undefined> = [undefined, true]

function stateReducer(
  prev: LoadingTuple<PermissionCheckResult | undefined>,
  action:
    | {type: 'loading'}
    | {type: 'value'; value: PermissionCheckResult}
    | {type: 'error'; error: unknown},
): LoadingTuple<PermissionCheckResult | undefined> {
  const [prevResult, prevIsLoading] = prev
  switch (action.type) {
    // Keep the old value around while loading a new one. Prevents "jittering" UIs, and permissions
    // usually don't change _that_ rapidly (this hook runs on every single document change).
    case 'loading':
      return [prevResult, true]
    case 'value':
      // Signal "no update" to React if we've got the same value as before by returning old state
      return !prevIsLoading && isEqual(action.value, prevResult) ? prev : [action.value, false]
    case 'error':
      throw action.error
    default:
      throw new Error(`Invalid action type: ${action}`)
  }
}

/** @internal */
export function useDocumentValuePermissions({
  document,
  permission,
  grantsStore: specifiedGrantsStore,
}: PartialExcept<DocumentValuePermissionsOptions, 'permission' | 'document'>): LoadingTuple<
  PermissionCheckResult | undefined
> {
  const defaultGrantsStore = useGrantsStore()
  const grantsStore = specifiedGrantsStore || defaultGrantsStore

  const [state, dispatch] = useReducer(stateReducer, INITIAL_STATE)
  const subscriptionRef = useRef<Subscription | null>(null)

  useEffect(() => {
    dispatch({type: 'loading'})

    // Unsubscribe from any previous subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
    }

    const permissions$ = getDocumentValuePermissions({
      grantsStore,
      document,
      permission,
    })

    subscriptionRef.current = permissions$
      .pipe(distinctUntilChanged((prev, next) => isEqual(prev, next)))
      .subscribe({
        next: (value) => dispatch({type: 'value', value}),
        error: (error) => dispatch({type: 'error', error}),
      })

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }
    }
  }, [grantsStore, document, permission])

  return state
}
