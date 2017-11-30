const path = require('path')
const uniq = require('lodash/uniq')
const resolveFrom = require('resolve-from')
const dynamicRequire = require('./dynamicRequire')

const getSanityVersions = basePath => {
  const manifestPath = path.join(basePath, 'package.json')

  let pkg
  try {
    pkg = dynamicRequire(manifestPath)
  } catch (err) {
    throw new Error(`Could not load package.json from ${manifestPath}`)
  }

  const dependencies = Object.keys(Object.assign({}, pkg.dependencies, pkg.devDependencies))
  const sanityDeps = dependencies.filter(depName => depName.indexOf('@sanity/') === 0)
  const versions = uniq(sanityDeps).reduce((target, moduleId) => {
    const modulePath = resolveFrom.silent(basePath, path.join(moduleId, 'package.json'))
    target[moduleId] = modulePath && dynamicRequire(modulePath).version
    return target
  }, {})

  return versions
}

module.exports = getSanityVersions
