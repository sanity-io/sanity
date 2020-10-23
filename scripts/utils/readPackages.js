/* eslint-disable no-sync */
const fs = require('fs')
const path = require('path')
const {getManifestPaths} = require('./getPackagePaths')

const rootPath = path.join(__dirname, '..', '..')

module.exports = function readPackages() {
  return getManifestPaths().map((file) => {
    const filePath = path.join(rootPath, file)
    const dirname = path.join(rootPath, path.dirname(file))
    return {
      path: filePath,
      dirname: dirname,
      content: JSON.parse(fs.readFileSync(filePath, 'utf8')),
    }
  })
}
