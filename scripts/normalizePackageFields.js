/* eslint-disable no-sync, no-console, id-length */
const fs = require('fs')
const path = require('path')
const glob = require('glob')
const uniq = require('lodash/uniq')
const config = require('../lerna.json')

const rootPath = path.join(__dirname, '..')
const patterns = config.packages.map(pkg => path.join(pkg, 'package.json'))
const flatten = (target, item) => target.concat(item)
const globFlatten = (files, pattern) => glob.sync(pattern).reduce(flatten, files)

const packages = patterns
  .reduce(globFlatten, [])
  .map(file => path.join(rootPath, file))
  .map(path => ({file: path, content: JSON.parse(fs.readFileSync(path, 'utf8'))}))

const COMMON_KEYWORDS = ['sanity', 'cms', 'headless', 'realtime', 'content']

function normalizePkgContent(pkg) {
  const pkgName = pkg.name.split('/').slice(-1)[0]
  return Object.assign({}, pkg, {
    bugs: {
      url: 'https://github.com/sanity-io/sanity/issues'
    },
    keywords: uniq(
      COMMON_KEYWORDS
        .concat(pkgName)
        .concat(pkg.keywords || [])),
    homepage: 'https://www.sanity.io/',
    license: 'MIT',
    repository: {
      type: 'git',
      url: 'git+https://github.com/sanity-io/sanity.git'
    }
  })
}

packages.forEach(package => {
  fs.writeFileSync(package.file, JSON.stringify(normalizePkgContent(package.content), null, 2) + '\n')
  console.log('Updated', package.file)
})
