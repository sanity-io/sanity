/* eslint-disable no-var */

var noRolesError = `The map of roles available to Sanity is empty.
This usually means that the Sanity plugin loader has not been configured.
Check your webpack configuration.`

var roles = {'#': '#'}

// The roles above is replaced by the webpack loader.
// If it is not enabled (user is using a custom setup),
// give a meaningful error back to the user so it'll
// be easier to diagnose the problem
if (roles['#']) {
  throw new Error(noRolesError)
}

module.exports = roles
