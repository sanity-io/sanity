import {map} from 'rxjs/operators'
import {debugRolesParam$} from '../../debugParams'
import {DatasetGrants} from '../types'
import * as grants from './exampleGrants'
import {ExampleRoleName} from './exampleRoles'

const DEBUG_ROLE_GRANTS_MAP: Record<ExampleRoleName, DatasetGrants> = {
  // basic
  administrator: grants.administrator,
  editor: grants.editor,
  developer: grants.developer,
  contributor: grants.contributor,
  viewer: grants.viewer,

  // custom
  restricted: grants.restricted,

  // legacy
  read: grants.viewer,
  write: grants.editor,
} as const

function isRoleName(value: string): value is ExampleRoleName {
  return Boolean(value) && value in DEBUG_ROLE_GRANTS_MAP
}

export const debugGrants$ = debugRolesParam$.pipe(
  map((roles) => {
    return roles.length > 0 ? getGrantsForRoles(roles) : null
  })
)

// todo: merge other resource keys(?)
export function getGrantsForRoles(roles: string[]) {
  return {
    'sanity.document.filter': roles
      .filter(isRoleName)
      .flatMap(
        (roleName: ExampleRoleName) =>
          DEBUG_ROLE_GRANTS_MAP[roleName]['sanity.document.filter'] || []
      ),
  }
}
