/* eslint-env node */
const path = require('path')
const loaderUtils = require('loader-utils')
const resolvedRoles = require('./resolved-roles') // @todo remove

const banner = '/* This file has been dynamically modified by the Sanity plugin loader */'
const mapBanner = '/* The following role map is dynamically built by the Sanity plugin loader */'
const rolesVarMatcher = /\n(var|let) roles = {'#': '#'}/

module.exports = function sanityPluginLoader(input) {
  const query = loaderUtils.parseQuery(this.query)

  if (this.cacheable) {
    this.cacheable()
  }

  // @todo see if we should add the sanity.json of plugins as dependencies as well
  this.addDependency(path.join(query.basePath, 'sanity.json'))

  const baseMap = JSON.stringify(resolvedRoles, null, 2)
  const pluginMap = baseMap
    .replace(/"path": "(.*)?"/g, '"path": require("$1")') // "path" => require("path")
    .replace(/"/g, '\'') // double quotes (") => single quotes (')
    .replace(/"([a-zA-Z]+)":/g, '$1:') // "safeIdentifiers" => safeIdentifiers

  const content = input.replace(
    rolesVarMatcher,
    `${mapBanner}\n$1 roles = ${pluginMap}`
  )

  return `${banner}\n${content}`
}
