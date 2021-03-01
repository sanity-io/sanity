const path = require('path')
const findConfig = require('find-config')

module.exports = function isSanityMonorepo(basePath) {
  const configPath = findConfig('package.json', {home: false, cwd: basePath})
  if (!configPath) {
    return false
  }

  try {
    // eslint-disable-next-line import/no-dynamic-require
    const pkg = require(configPath)
    if (pkg.isSanityMonorepo) {
      return true
    }
  } catch (err) {
    return false
  }

  return isSanityMonorepo(path.dirname(path.dirname(configPath)))
}
