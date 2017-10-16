#!/usr/bin/env node
/* eslint-disable no-sync, no-console, strict */
'use strict'

const fs = require('fs')
const path = require('path')
const rimraf = require('rimraf')

const pkgPath = path.join(__dirname, '..', 'packages')
const targetDir = process.argv[2]
if (!targetDir) {
  throw new Error('Target directory must be specified (`.` for current dir)')
}

const notSanity = dir => dir !== '@sanity'
const prefix = name => `@sanity/${name}`
const normalize = dir => dir.replace(/@sanity\//g, `@sanity${path.sep}`)

const rootPackages = fs.readdirSync(pkgPath).filter(notSanity)
const sanityPackages = fs.readdirSync(path.join(pkgPath, '@sanity')).map(prefix)
const packages = [].concat(rootPackages, sanityPackages)

const targetPath = path.resolve(path.relative(process.cwd(), targetDir))
const targetDepsPath = path.join(targetPath, 'node_modules')

const targetPkg = require(path.join(targetPath, 'package.json'))
const targetDeclared = Object.assign({}, targetPkg.dependencies, targetPkg.devDependencies)
const targetDeps = Object.keys(targetDeclared)

const targetRootPackages = fs.readdirSync(targetDepsPath).filter(notSanity)
const targetSanityPackages = fs.readdirSync(path.join(targetDepsPath, '@sanity')).map(prefix)
const targetPackages = [].concat(targetRootPackages, targetSanityPackages, targetDeps)

const sharedPackages = packages.filter(pkg => targetPackages.indexOf(pkg) > -1)
const sharedDeclared = packages.filter(pkg => targetDeps.indexOf(pkg) > -1)

const removeFolders = sharedPackages.map(normalize).map(dir => path.join(targetDepsPath, dir))

// First, remove all locally installed dependencies that exists as a package in our monorepo
console.log('Removing dependencies from node_modules:')
console.log(`\n  ${sharedPackages.join('\n  ')}\n`)

removeFolders.forEach(dir => rimraf.sync(dir))

// Secondly, symlink into node_modules, but only the dependencies declared in package.json
console.log('Symlinking dependencies to node_modules:\n')
sharedDeclared.forEach(dep => {
  const sourceDepDir = path.join(pkgPath, normalize(dep))
  const targetDepDir = path.join(targetDepsPath, normalize(dep))

  console.log(`  ${sourceDepDir} -> ${targetDepDir}`)
  fs.symlinkSync(sourceDepDir, targetDepDir, 'dir')
})

console.log('\nDone!')
