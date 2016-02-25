// @todo Add links to documentation about the plugin loader in the error
const noRolesError = `The map of roles available to Sanity is empty.
This usually means that the Sanity plugin loader has not been configured.
Check your webpack configuration.`

var roles = {'#': '#'} // eslint-disable-line no-var

export function setRoles(roleMap) {
  roles = roleMap
}

export function getRole(role) {
  if (roles['#']) {
    throw new Error(noRolesError)
  }

  return roles[role]
}
