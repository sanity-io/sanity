/* eslint-disable no-sync, no-console, id-length */
const fs = require('fs')
const path = require('path')
const glob = require('glob')
const chalk = require('chalk')
const semver = require('semver')
const config = require('../lerna.json')
const corePkg = require('../package.json')

const rootPath = path.join(__dirname, '..')
const stripRange = version => version.replace(/^[~^]/, '')
const sortRanges = ranges => ranges.sort((a, b) => semver.compare(stripRange(a), stripRange(b)))
const patterns = config.packages.map(pkg => path.join(pkg, 'package.json'))
const flatten = (target, item) => target.concat(item)
const globFlatten = (files, pattern) => glob.sync(pattern).reduce(flatten, files)
const dependencies = patterns
  .reduce(globFlatten, [])
  .map(file => path.join(rootPath, file))
  .map(file => fs.readFileSync(file, 'utf8'))
  .map(file => JSON.parse(file))
  .concat(corePkg)
  .map(file => ({name: file.name, deps: Object.assign({}, file.dependencies || {}, file.devDependencies || {})}))

const versionRanges = {}
const fixable = {}

dependencies.forEach(item => {
  if (!item.name) {
    return
  }

  Object.keys(item.deps).forEach(pkg => {
    const version = item.deps[pkg]
    versionRanges[pkg] = versionRanges[pkg] || {}
    versionRanges[pkg][version] = versionRanges[pkg][version] || []
    versionRanges[pkg][version].push(item.name)
  })
})

Object.keys(versionRanges).forEach(depName => {
  const versions = Object.keys(versionRanges[depName])
  if (versions.length === 1) {
    return
  }

  const plain = versions
    .map(stripRange)
    .filter(version => /^\d+\.\d+\.\d+/.test(version))
    .sort(semver.rcompare)

  const greatestVersion = plain[0]
  const greatestMajor = `${semver.major(greatestVersion)}.0.0`
  const greatestRange = `^${greatestVersion}`

  console.log('')
  console.log(chalk.cyan(depName))

  sortRanges(versions).forEach(range => {
    const packages = versionRanges[depName][range]

    const isFixable = semver.satisfies(stripRange(range), `^${greatestMajor}`)
    const isGreatest = range === greatestRange
    const sign = isGreatest || isFixable ? chalk.green('✔') : chalk.red('✖')

    console.log(`  ${chalk[isGreatest ? 'green' : 'yellow'](range)}:`)
    console.log(`    ${sign} ${packages.join(`\n    ${sign} `)}`)

    if (range === greatestRange || !isFixable) {
      return
    }

    packages.forEach(pkgName => {
      fixable[pkgName] = fixable[pkgName] || []
      fixable[pkgName].push({depName, version: greatestRange})
    })
  })
})

const fixablePackages = Object.keys(fixable)

fixablePackages.forEach(pkg => {
  const toFix = fixable[pkg]
  const manifestPath = pkg === corePkg.name
    ? path.join(rootPath, 'package.json')
    : path.join(rootPath, 'packages', pkg, 'package.json')

  const manifest = require(manifestPath)
  toFix.forEach(dep => {
    const depSection = (manifest.dependencies || {})[dep.depName]
      ? manifest.dependencies
      : manifest.devDependencies

    depSection[dep.depName] = dep.version
  })

  const json = `${JSON.stringify(manifest, null, 2)}\n`
  fs.writeFileSync(manifestPath, json, 'utf-8')
})

if (fixablePackages.length > 0) {
  console.log('')
  console.log([
    'Updated version ranges for %d packages,',
    'you might want to run "npm run bootstrap"',
    'and run some tests before pushing changes'
  ].join(' '), fixablePackages.length)
}
