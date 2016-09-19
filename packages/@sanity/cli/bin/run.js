#!/usr/bin/env node
/* eslint-disable no-console, prefer-arrow-callback, no-process-exit, no-sync, no-var */

/**
 * NOTE: KEEP THIS FILE NODE 4 COMPATIBLE, ERGO; DONT USE LET/CONST, ARROW FUNCTIONS ETC
 */
var cwd = null
try {
  cwd = process.cwd()
} catch (err) {
  if (err.code === 'ENOENT') {
    console.error('[ERR] Could not resolve working directory, does the current folder exist?')
    process.exit(1)
  } else {
    throw err
  }
}

var fs = require('fs')
var path = require('path')
var thenify = require('thenify')
var pkg = require('../package.json')
var stat = thenify(fs.stat)

var devMode = hasDevMode()
var preferGlobal = process.argv[2] === '-g'
var argv = process.argv.slice(2)
var debug = require('../lib/debug')

if (devMode) {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason.stack)
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
  checkLocalCli().then(loadCli).catch(function (err) {
    console.error(err.stack)
    process.exit(1)
  })
}

function loadCli(localCliPath) {
  if (localCliPath) {
    // The local CLI exists, use that
    require(localCliPath).run(argv)
  } else {
    // No local CLI found, use global version
    console.log(`[Sanity] Using global "${pkg.name}"`)
    require('../lib/cli.js').run(argv)
  }
}

function checkLocalCli() {
  return readManifestIfExists(path.join(cwd, 'package.json'), {encoding: 'utf8'})
    .then(parseManifest)
    .then(hasLocalCliDeclared)
    .then(hasLocalCliInstalled)
}

function hasLocalCliDeclared(manifest) {
  return manifest && manifest.dependencies && manifest.dependencies[pkg.name]
}

function hasLocalCliInstalled(isDeclared) {
  if (!isDeclared) {
    return false
  }

  var fullPath = path.resolve(path.join(cwd, 'node_modules', pkg.name))
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

function hasDevMode() {
  try {
    fs.statSync(path.join(__dirname, '..', 'src'))
    return true
  } catch (err) {
    return false
  }
}
