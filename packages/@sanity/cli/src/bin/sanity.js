#!/usr/bin/env node

/* eslint-disable no-console, no-process-exit, no-sync */
import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import resolveFrom from 'resolve-from'
import updateNotifier from 'update-notifier'
import {resolveProjectRoot} from '@sanity/resolver'
import pkg from '../../package.json'
import parseArguments from '../util/parseArguments'
import runCli from '../cli'

// Weird edge case where the folder the terminal is currently in has been removed
let cwd = null
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

updateNotifier({pkg}).notify({defer: false})

const devMode = hasDevMode()
const args = parseArguments()
const isInit = args.groupOrCommand === 'init'

// Resolve project root directory
let workDir = cwd
try {
  workDir = resolveProjectRoot({
    basePath: cwd,
    sync: true
  }) || cwd
} catch (err) {
  console.warn(chalk.red([
    'Error occured trying to resolve project root:',
    err.message
  ].join('\n')))
  process.exit(1)
}

if (devMode) {
  require('source-map-support').install()

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason.stack)
  })
}

if (!isInit && workDir !== cwd) {
  console.log(`Not in project directory, assuming context of project at ${workDir}`)
}

runCli(args, {
  workDir: isInit ? process.cwd() : workDir,
  corePath: getCoreModulePath(workDir)
})

function getCoreModulePath() {
  const pkgPath = resolveFrom(workDir, '@sanity/core')
  if (pkgPath) {
    return pkgPath
  }

  const hasManifest = fs.existsSync(path.join(workDir, 'sanity.json'))
  if (hasManifest && process.argv.indexOf('install') === -1) {
    console.warn(chalk.yellow([
      '@sanity/core not installed in current project',
      'Project-specific commands not available until you run `sanity install`'
    ].join('\n')))
  }

  return undefined
}

function hasDevMode() {
  return fs.existsSync(path.join(__dirname, '..', '..', 'src'))
}


