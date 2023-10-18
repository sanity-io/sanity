#!/usr/bin/env node
/* eslint-disable no-sync, no-console, strict */
/**
 * THIS SCRIPT NEEDS TO STAY AS A CommonJS JavaScript FILE
 * (it's executed in node by the `CLI unit tests`, and possibly other places)
 **/
'use strict'

const fs = require('fs')
const path = require('path')
const rimraf = require('rimraf')
const minimist = require('minimist')

const argv = minimist(process.argv.slice(2), {boolean: ['all']})

const targetDir = argv._[0]
if (!targetDir) {
  throw new Error('Target directory must be specified (`.` for current dir)')
}

const notSanity = (dir) => dir !== '@sanity'
const prefix = (name) => `@sanity/${name}`
const normalize = (dir) => dir.replace(/@sanity\//g, `@sanity${path.sep}`)

const pkgPath = path.join(__dirname, '..', 'packages')
const rootPackages = fs.readdirSync(pkgPath).filter(notSanity)
const sanityPackages = fs.readdirSync(path.join(pkgPath, '@sanity')).map(prefix)
const packages = [...rootPackages, ...sanityPackages]

const targetPath = path.resolve(path.relative(process.cwd(), targetDir))
const targetDepsPath = path.join(targetPath, 'node_modules')

let targetDeps = packages
if (!argv.all) {
  // eslint-disable-next-line import/no-dynamic-require
  const targetPkg = require(path.join(targetPath, 'package.json'))
  const targetDeclared = Object.assign({}, targetPkg.dependencies, targetPkg.devDependencies)
  targetDeps = Object.keys(targetDeclared)
}

const targetRootPackages = fs.readdirSync(targetDepsPath).filter(notSanity)
const targetSanityPackages = fs.readdirSync(path.join(targetDepsPath, '@sanity')).map(prefix)

if (targetDeps.includes('sanity')) {
  // in v3 studios, we'll want to explicitly link/keep `@sanity/cli`,
  // since it has the `sanity` cli binary
  targetDeps.push('@sanity/cli')
}

// All the dependencies in the root of node_modules and node_modules/@sanity
const targetPackages = [...targetRootPackages, ...targetSanityPackages, ...targetDeps]
const sharedPackages = argv.all
  ? packages
  : packages.filter((pkgName) => targetPackages.indexOf(pkgName) > -1)

const sharedDeclared = argv.all
  ? packages
  : packages.filter((pkgName) => targetDeps.indexOf(pkgName) > -1)

const removeFolders = sharedPackages.map(normalize).map((dir) => path.join(targetDepsPath, dir))

// First, remove all locally installed dependencies that exists as a package in our monorepo
console.log('Removing dependencies from node_modules:')
console.log(`\n  ${sharedPackages.join('\n  ')}\n`)

removeFolders.forEach((dir) => rimraf.sync(dir))

// Secondly, symlink into node_modules, but only the dependencies declared in package.json
console.log('Symlinking dependencies to node_modules:\n')
sharedDeclared.forEach((dep) => {
  const sourceDepDir = path.join(pkgPath, normalize(dep))
  const targetDepDir = path.join(targetDepsPath, normalize(dep))

  console.log(`  ${sourceDepDir} -> ${targetDepDir}`)
  fs.symlinkSync(sourceDepDir, targetDepDir, 'dir')
})

console.log('\nDone!')
