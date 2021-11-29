import type {Observable} from 'rxjs'
import {createHookFromObservableFactory} from '../../util/createHookFromObservableFactory'
import type {PermissionCheckResult} from './types'
import {DocumentValuePermission} from './types'
import grantsStore from './grantsStore'

export interface DocumentValuePermissionsOptions {
  document: Record<string, unknown>
  permission: DocumentValuePermission
}

const {checkDocumentPermission} = grantsStore

/**
 * The observable version of `useDocumentValuePermissions`
 *
 * @see useDocumentValuePermissions
 */
function getDocumentValuePermissions({
  document,
  permission,
}: DocumentValuePermissionsOptions): Observable<PermissionCheckResult> {
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
const useDocumentValuePermissions = createHookFromObservableFactory(getDocumentValuePermissions)

export {
  /* eslint-disable camelcase */
  getDocumentValuePermissions as unstable_getDocumentValuePermissions,
  useDocumentValuePermissions as unstable_useDocumentValuePermissions,
  /* eslint-enable camelcase */
}
export {DocumentValuePermission}
