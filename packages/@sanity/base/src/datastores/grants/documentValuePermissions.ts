import {Observable} from 'rxjs'
import {createLoadableHook} from '../../util/useLoadable'
import {DocumentValuePermission, PermissionCheckResult} from './types'
import grantsStore from './createGrantsStore'

export interface DocumentValuePermissionsOptions {
  document: Record<string, unknown>
  permission: DocumentValuePermission
}

const {checkDocumentPermission} = grantsStore

function getDocumentValuePermissions({
  document,
  permission,
}: DocumentValuePermissionsOptions): Observable<PermissionCheckResult> {
  return checkDocumentPermission(permission, document)
}

const useDocumentValuePermissions = createLoadableHook(getDocumentValuePermissions)

export {
  /* eslint-disable camelcase */
  getDocumentValuePermissions as unstable_getDocumentValuePermissions,
  useDocumentValuePermissions as unstable_useDocumentValuePermissions,
  /* eslint-enable camelcase */
}
export {DocumentValuePermission}
