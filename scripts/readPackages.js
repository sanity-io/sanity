/* eslint-disable no-sync */
const fs = require('fs')
const path = require('path')
const glob = require('glob')
const config = require('../lerna.json')

const rootPath = path.join(__dirname, '..')
const patterns = config.packages.map(pkg => path.join(pkg, 'package.json'))
const flatten = (target, item) => target.concat(item)
const globFlatten = (files, pattern) => glob.sync(pattern).reduce(flatten, files)

module.exports = function readPackages() {
  return patterns
    .reduce(globFlatten, [])
    .map(file => {
      const filePath = path.join(rootPath, file)
      const dirname = path.join(rootPath, path.dirname(file))
      return ({
        path: filePath,
        dirname: dirname,
        content: JSON.parse(fs.readFileSync(filePath, 'utf8'))
      })
    })
}
