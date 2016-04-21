#!/usr/bin/env node
/* eslint-disable no-console, prefer-arrow-callback, no-process-exit, no-sync */
const fs = require('fs')
const path = require('path')
const thenify = require('thenify')
const pkg = require('../package.json')
const stat = thenify(fs.stat)

const devMode = isDevMode()
const preferGlobal = devMode && process.argv[2] === '-g'
const argv = process.argv.slice(2)
const debug = require(devMode ? '../src/debug' : '../lib/debug')

// If we're in development mode, compile ES6 on the fly
if (devMode) {
  require('babel-register')
  debug('CLI running in development mode')
}

if (devMode) {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at: Promise ', promise, ' reason: ', reason)
  })
}

// Remove the "global flag" in case any subcommands use the same option
if (preferGlobal) {
  argv.splice(0, 1)
  debug('Global flag set, using global Sanity CLI regardless of any local version')
}

/**
 * Check if there is a `package.json` file in the current directory, and it if contains
 * a @sanity/cli-dependency. If so, use that over the globally installed version, in order
 * to do things in line with the Sanity version currently being used by this project
 */
if (preferGlobal) {
  loadCli()
} else {
  checkLocalCli(process.cwd()).then(loadCli).catch(function (err) {
    console.error(err.stack)
    process.exit(1)
  })
}

function loadCli(localCliPath) {
  if (localCliPath) {
    // The local CLI exists, warn the user that we are using it and run it
    console.log(`[Sanity] Local "${pkg.name}"-dependency found, using that over global version`)
    require(localCliPath).run(argv)
  } else {
    // No local CLI found, use global version
    require(devMode ? '../src/cli.js' : '../lib/cli.js').run(argv)
  }
}

function checkLocalCli(cwd) {
  return readManifestIfExists(path.join(cwd, 'package.json'), {encoding: 'utf8'})
    .then(parseManifest)
    .then(hasLocalCliDeclared)
    .then(isDeclared => hasLocalCliInstalled(cwd, isDeclared))
}

function hasLocalCliDeclared(manifest) {
  return manifest && manifest.dependencies && manifest.dependencies[pkg.name]
}

function hasLocalCliInstalled(cwd, isDeclared) {
  if (!isDeclared) {
    return false
  }

  const fullPath = path.resolve(path.join(cwd, 'node_modules', pkg.name))
  return stat(fullPath).then(() => fullPath).catch(err => {
    if (err.code === 'ENOENT') {
      throw new Error(
        `Local ${pkg.name} dependency declared, but not installed, run \`npm install\``
      )
    }

    throw err
  })
}

function parseManifest(content) {
  try {
    return JSON.parse(content)
  } catch (err) {
    throw new Error(`Error while attempting to read projects "package.json":\n${err.message}`)
  }
}

function readManifestIfExists(manifestPath, opts) {
  return new Promise((resolve, reject) => {
    fs.readFile(manifestPath, opts, (err, manifest) => {
      if (manifest) {
        return resolve(manifest)
      } else if (err && err.code === 'ENOENT') {
        return resolve('{}')
      }

      reject(err)
    })
  })
}

// @todo Figure out a better way to detect if we're running in "development mode"
function isDevMode() {
  return Boolean(pkg._id) === false
}
