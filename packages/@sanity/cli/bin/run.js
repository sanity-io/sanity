#!/usr/bin/env node
// @todo compile along with src?
/* eslint-disable no-console, prefer-arrow-callback, no-process-exit, no-sync, no-var */
/**
 * NOTE: KEEP THIS FILE NODE 4 COMPATIBLE, ERGO; DONT USE LET/CONST, ARROW FUNCTIONS ETC
 */

// Weird edge case where the folder the terminal is currently in has been removed
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
var chalk = require('chalk')
var resolver = require('@sanity/resolver')
var resolveFrom = require('resolve-from')
var updateNotifier = require('update-notifier')
var pkg = require('../package.json')
var runCli = require('../lib/cli')

updateNotifier({pkg}).notify({defer: false})

var devMode = hasDevMode()
var workDir = resolver.resolveProjectRoot({
  basePath: cwd,
  sync: true
}) || cwd

if (devMode) {
  require('source-map-support').install()

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason.stack)
  })
}

if (workDir !== cwd) {
  console.log(`Not in project directory, assuming context of project at ${workDir}`)
}

const hasManifest = hasSanityManifest(workDir)
const corePath = getCoreModulePath()

runCli({
  workDir,
  corePath
})

function getCoreModulePath() {
  var pkgPath = resolveFrom(workDir, '@sanity/core')
  if (pkgPath) {
    return pkgPath
  }

  if (hasManifest) {
    console.warn(chalk.yellow([
      '@sanity/core not installed in current project',
      'Project-specific commands not available until you run `sanity install`'
    ].join('\n')))
  }

  return undefined
}

function hasDevMode() {
  return fs.existsSync(path.join(__dirname, '..', 'src'))
}

function hasSanityManifest(dir) {
  return fs.existsSync(path.join(dir, 'sanity.json'))
}

