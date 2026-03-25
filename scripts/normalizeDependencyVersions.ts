import {execSync} from 'node:child_process'
import fs from 'node:fs'
import path, {dirname} from 'node:path'
import {fileURLToPath} from 'node:url'

import chalk from 'chalk'
import semver from 'semver'

interface PackageJson {
  name: string
}

interface PnpmPackage {
  name: string
  path: string
}

const rootPath = path.join(dirname(fileURLToPath(import.meta.url)), '..')

const corePkg: PackageJson = JSON.parse(
  fs.readFileSync(path.join(rootPath, 'package.json'), 'utf8'),
)

if (!('name' in corePkg) || typeof corePkg.name !== 'string') {
  throw new Error('Core package.json is missing "name" string')
}

const pnpmOutput = execSync('pnpm ls -r --json --depth -1', {
  cwd: rootPath,
  encoding: 'utf-8',
  maxBuffer: 10 * 1024 * 1024,
})

const pnpmPackages: PnpmPackage[] = JSON.parse(pnpmOutput)

const stripRange = (version: string) => version.replace(/^[~^]/, '')
const sortRanges = (ranges: string[]) =>
  ranges.sort((a, b) => {
    try {
      return semver.compare(stripRange(a), stripRange(b))
    } catch {
      return 1
    }
  })

const pkgs = pnpmPackages
  .map((pkg) => ({
    file: path.join(pkg.path, 'package.json'),
    pkg: JSON.parse(fs.readFileSync(path.join(pkg.path, 'package.json'), 'utf8')),
  }))
  .map(({file, pkg}) => ({
    file,
    name: pkg.name,
    deps: Object.assign({}, pkg.dependencies || {}, pkg.devDependencies || {}) as Record<
      string,
      string
    >,
  }))

const versionRanges: Record<string, Record<string, string[]>> = {}
const fixable: Record<string, {depName: string; version: string}[]> = {}

pkgs.forEach((pkg) => {
  if (!pkg.name) {
    return
  }

  Object.keys(pkg.deps).forEach((depName) => {
    const version = pkg.deps[depName]
    versionRanges[depName] = versionRanges[depName] || {}
    versionRanges[depName][version] = versionRanges[depName][version] || []
    versionRanges[depName][version].push(pkg.name)
  })
})

Object.keys(versionRanges).forEach((depName) => {
  const versions = Object.keys(versionRanges[depName])
  if (versions.length === 1) {
    return
  }

  const plain = versions
    .map(stripRange)
    .filter((version) => /^\d+\.\d+\.\d+/.test(version))
    .sort(semver.rcompare)

  const greatestVersion = plain[0]
  const greatestMajor = `${semver.major(greatestVersion)}.0.0`
  const greatestRange = `^${greatestVersion}`

  console.log('')
  console.log(chalk.cyan(depName))

  sortRanges(versions).forEach((range) => {
    const packages = versionRanges[depName][range]

    let isFixable
    try {
      isFixable = semver.satisfies(stripRange(range), `^${greatestMajor}`)
    } catch {
      return
    }

    const isGreatest = range === greatestRange
    const sign = isGreatest || isFixable ? chalk.green('✔') : chalk.red('✖')

    console.log(`  ${chalk[isGreatest ? 'green' : 'yellow'](range)}:`)
    console.log(
      `    ${sign} ${packages
        .map((pkgName) => {
          // eslint-disable-next-line max-nested-callbacks
          const pkg = pkgs.find((p) => p.name === pkgName)!

          return `${pkgName} ${chalk.gray(path.relative(rootPath, pkg.file))}`
        })
        .join(`\n    ${sign} `)}`,
    )

    if (range === greatestRange || !isFixable) {
      return
    }

    packages.forEach((pkgName) => {
      fixable[pkgName] = fixable[pkgName] || []
      fixable[pkgName].push({depName, version: greatestRange})
    })
  })
})

const fixablePackages = Object.keys(fixable)

fixablePackages.forEach((pkg) => {
  const toFix = fixable[pkg]
  const manifestPath =
    pkg === corePkg.name
      ? path.join(rootPath, 'package.json')
      : pkgs.find((mod) => mod.name === pkg)?.file

  if (!manifestPath) {
    return
  }

  let manifest: {dependencies: Record<string, string>; devDependencies: Record<string, string>}
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    manifest = require(manifestPath)
  } catch {
    return
  }

  toFix.forEach((dep) => {
    const depSection = (manifest.dependencies || {})[dep.depName]
      ? manifest.dependencies
      : manifest.devDependencies

    depSection[dep.depName] =
      dep.depName.indexOf('@sanity/') === 0 ? dep.version.replace(/^[~^]/, '') : dep.version
  })

  const json = `${JSON.stringify(manifest, null, 2)}\n`
  fs.writeFileSync(manifestPath, json, 'utf-8')
})

if (fixablePackages.length > 0) {
  console.log('')
  console.log(
    [
      'Updated version ranges for %d packages,',
      'you might want to run "pnpm bootstrap"',
      'and run some tests before pushing changes',
    ].join(' '),
    fixablePackages.length,
  )
  console.log('')
}
