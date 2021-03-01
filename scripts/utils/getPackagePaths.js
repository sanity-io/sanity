/* eslint-disable no-sync */
const path = require('path')
const glob = require('glob')
const config = require('../../lerna.json')

const patterns = config.packages.map((pkg) => path.join(pkg, 'package.json'))
const flatten = (target, item) => target.concat(item)
const globFlatten = (files, pattern) => glob.sync(pattern).reduce(flatten, files)

function getManifestPaths() {
  return patterns.reduce(globFlatten, [])
}

function getPackagePaths() {
  return getManifestPaths().map((p) => path.dirname(p))
}

exports.getManifestPaths = getManifestPaths
exports.getPackagePaths = getPackagePaths
