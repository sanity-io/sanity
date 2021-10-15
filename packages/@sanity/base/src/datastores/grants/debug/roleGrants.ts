import {map} from 'rxjs/operators'
import {debugRolesParam$} from '../../debugParams'
import {Grant} from '../types'
import * as grants from './exampleGrants'
import {ExampleRoleName} from './exampleRoles'

const DEBUG_ROLE_GRANTS_MAP: Record<ExampleRoleName, Grant[]> = {
  // basic
  administrator: grants.administrator,
  editor: grants.editor,
  developer: grants.developer,
  contributor: grants.contributor,
  viewer: grants.viewer,

  // custom
  restricted: grants.restricted,
  requiresApproval: grants.requiresApproval,

  // legacy
  read: grants.viewer,
  write: grants.editor,
}

// todo: merge other resource keys(?)
export const debugGrants$ = debugRolesParam$.pipe(
  map((roles) => {
    if (!roles.length) return null

    return roles
      .filter((value) => Boolean(value) && value in DEBUG_ROLE_GRANTS_MAP)
      .flatMap((roleName: ExampleRoleName) => DEBUG_ROLE_GRANTS_MAP[roleName] || [])
  })
)
