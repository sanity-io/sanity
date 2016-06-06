import path from 'path'

function assignFulfillers(fulfilled, plugin, roles, opts = {}) {
  (plugin.manifest.roles || []).forEach(role => {
    if (!role.path && !role.srcPath) {
      return
    }

    const implRoleName = role.implements || role.name
    if (!roles.definitions[implRoleName]) {
      throw new Error(
        `Plugin "${plugin.name}" tried to implement role "${implRoleName}", which is not defined. Missing a plugin?`
      )
    }

    if (role.implements && !roles.definitions[role.implements].isAbstract) {
      throw new Error([
        `Plugin "${plugin.name}" tried to implement role "${implRoleName}", which is not `,
        'an abstract role (a path was specified when defining it, which disallows overriding)'
      ].join(''))
    }

    const isLib = opts.ignoreSrcPath || plugin.path.split(path.sep).indexOf('node_modules') !== -1
    const rolePath = isLib ? role.path : (role.srcPath || role.path);

    // A role can both implement a role and define a new one
    ['implements', 'name'].forEach(key => {
      const roleName = role[key]
      if (!roleName) {
        return
      }

      if (!fulfilled[roleName]) {
        fulfilled[roleName] = fulfilled[roleName] || []
      }

      fulfilled[roleName].push({
        plugin: plugin.name,
        path: path.resolve(path.join(plugin.path, rolePath))
      })
    })
  })

  return fulfilled
}

export default assignFulfillers
