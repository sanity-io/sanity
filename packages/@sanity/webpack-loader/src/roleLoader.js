import path from 'path'
import getBaseLoader from './getBaseLoader'

const banner = '/* This file has been dynamically modified by the Sanity plugin loader */'
const mapBanner = '/* The following role map is dynamically built by the Sanity plugin loader */'
const rolesVarMatcher = /\n(var|let) roles = {'#': '#'}/

function sanityRoleLoader(options, callback) {
  const {roles, input} = options

  // Also add plugin manifests as dependencies
  roles.plugins.forEach(plugin => {
    this.addDependency(path.join(plugin.path, 'sanity.json'))
  })

  const map = Object.keys(roles.fulfilled).reduce((target, role) => {
    if (role.indexOf('style:') === 0) {
      target[role] = {
        plugin: roles.fulfilled[role].plugin,
        paths: [roles.fulfilled[role].path]
      }
    } else {
      target[role] = roles.fulfilled[role]
    }

    return target
  }, {})

  const baseMap = JSON.stringify(map, null, 2)

  // { "path": "/some/path" } => { "module": require("/some/path") }
  const pluginMap = baseMap.replace(/"path": "(.*)?"/g, '"module": require("$1")')

  const content = input.replace(
    rolesVarMatcher,
    `${mapBanner}\n$1 roles = ${pluginMap}`
  )

  callback(null, `${banner}\n${content}`)
}

module.exports = getBaseLoader(sanityRoleLoader)
