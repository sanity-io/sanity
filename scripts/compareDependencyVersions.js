const fs = require('fs')
const path = require('path')
const glob = require('glob')
const chalk = require('chalk')
const config = require('../lerna.json')

const patterns = config.packages.map(pkg => path.join(pkg, 'package.json'))
const flatten = (target, item) => target.concat(item)
const globFlatten = (files, pattern) => glob.sync(pattern).reduce(flatten, files)
const dependencies = patterns
  .reduce(globFlatten, [])
  .map(file => fs.readFileSync(file, 'utf8'))
  .map(file => JSON.parse(file))
  .map(file => ({name: file.name, deps: Object.assign({}, file.dependencies || {}, file.devDependencies || {})}))

const versionRanges = {}

dependencies.forEach(item => {
  Object.keys(item.deps).forEach(pkg => {
    const version = item.deps[pkg]
    versionRanges[pkg] = versionRanges[pkg] || {}
    versionRanges[pkg][version] = versionRanges[pkg][version] || []
    versionRanges[pkg][version].push(item.name)
  })
})

Object.keys(versionRanges).forEach(pkgName => {
  const versions = Object.keys(versionRanges[pkgName])
  if (versions.length === 1) {
    return
  }

  console.log(chalk.yellow(pkgName))
  versions.forEach(version => {
    console.log(`  ${chalk.green(version)}:`)
    console.log(`    ${versionRanges[pkgName][version].join('\n    ')}`)
  })
})
