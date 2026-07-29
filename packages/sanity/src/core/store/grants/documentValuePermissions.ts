import isEqual from 'lodash-es/isEqual.js'
import {useMemo} from 'react'
import {distinctUntilChanged, type Observable} from 'rxjs'

import {
  createHookFromObservableFactory,
  type LoadingTuple,
} from '../../util/createHookFromObservableFactory'
import {type PartialExcept} from '../../util/PartialExcept'
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

function getDocumentValuePermissionsWithDistinct(
  options: DocumentValuePermissionsOptions,
): Observable<PermissionCheckResult> {
  return getDocumentValuePermissions(options).pipe(
    distinctUntilChanged((prev, next) => isEqual(prev, next)),
  )
}

const useDocumentValuePermissionsFromHookFactory = createHookFromObservableFactory(
  getDocumentValuePermissionsWithDistinct,
  undefined,
)

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

  return useDocumentValuePermissionsFromHookFactory(
    useMemo(
      () => ({
        grantsStore,
        document,
        permission,
      }),
      [grantsStore, document, permission],
    ),
  )
}
