import {Observable} from 'rxjs'
import {createHookFromObservableFactory} from '../../util/createHookFromObservableFactory'
import {PartialExcept} from '../../util/PartialExcept'
import {useGrantsStore} from '../datastores'
import {DocumentValuePermission, GrantsStore, PermissionCheckResult} from './types'

export interface DocumentValuePermissionsOptions {
  grantsStore: GrantsStore
  document: Record<string, unknown>
  permission: DocumentValuePermission
}

/**
 * The observable version of `useDocumentValuePermissions`
 *
 * @see useDocumentValuePermissions
 */
export function getDocumentValuePermissions({
  grantsStore,
  document,
  permission,
}: DocumentValuePermissionsOptions): Observable<PermissionCheckResult> {
  const {checkDocumentPermission} = grantsStore

  return checkDocumentPermission(permission, document)
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
 */
export const useDocumentValuePermissionsFromHookFactory = createHookFromObservableFactory(
  getDocumentValuePermissions
)

export function useDocumentValuePermissions({
  document,
  permission,
  ...rest
}: PartialExcept<DocumentValuePermissionsOptions, 'permission' | 'document'>): ReturnType<
  typeof useDocumentValuePermissionsFromHookFactory
> {
  const grantsStore = useGrantsStore()

  return useDocumentValuePermissionsFromHookFactory({
    grantsStore: rest.grantsStore || grantsStore,
    document,
    permission,
  })
}

export type {DocumentValuePermission}
