import {Role} from '@sanity/types'

export const exampleRoles: Record<string, Role> = {
  // basic
  administrator: {name: 'administrator', title: 'Administrator'},
  viewer: {name: 'Viewer', title: 'Viewer'},
  editor: {name: 'editor', title: 'Editor'},
  developer: {name: 'developer', title: 'Developer'},
  contributor: {name: 'contributor', title: 'Contributor'},

  // custom
  restricted: {name: 'restricted', title: 'Restricted'},
  requiresApproval: {name: 'requiresApproval', title: 'Requires approval'},

  // legacy
  read: {name: 'read', title: 'Read'},
  write: {name: 'write', title: 'Write'},
}

export type ExampleRoleName = keyof typeof exampleRoles

export function getDebugRolesByNames(roleNames: string[]): Role[] {
  return roleNames
    .filter((roleName) => roleName in exampleRoles)
    .map((roleName) => exampleRoles[roleName])
}
