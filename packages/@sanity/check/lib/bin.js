#!/usr/bin/env node

/* eslint-disable no-console, no-process-env, no-process-exit */
'use strict'

var path = require('path')

var fse = require('fs-extra')

var chalk = require('chalk')

var sanityCheck = require('./sanityCheck')

var pkg = require('../package.json')

var includes = (arr, val) => arr.indexOf(val) !== -1

var tag = '[sanity-check]'
var args = process.argv.slice(2)
var relativeDir = args.filter((arg) => arg[0] !== '-')[0]
var dir = path.resolve(process.cwd(), relativeDir || '.')
var manifestDir = path.join(dir, 'sanity.json')
var showHelp = includes(args, '-h') || includes(args, '--help')
var showVersion = includes(args, '-v') || includes(args, '--version')
var productionMode =
  process.env.NODE_ENV === 'production' || includes(args, '-p') || includes(args, '--production')

if (showHelp) {
  console.log('Usage: sanity-check [DIRECTORY]')
  console.log(''.concat(pkg.description, '.\n'))
  console.log('-p, --production  check production (compiled) paths')
  console.log('-v, --version     output version information and exit')
  console.log('-h, --help        display this help and exit\n')
  console.log('With no DIRECTORY, checks current directory.')
  process.exit(1)
}

if (showVersion) {
  console.log('sanity-check '.concat(pkg.version))
  process.exit()
}

fse
  .readJson(manifestDir)
  .catch((err) => {
    console.error(
      chalk.red(''.concat(tag, ' Failed to read "').concat(manifestDir, '":\n').concat(err.message))
    )
    process.exit(1)
  })
  .then(() =>
    sanityCheck({
      dir,
      productionMode,
    })
  )
  .catch((err) => {
    console.error(
      chalk.red(err.sanityCheck ? ''.concat(tag, '\n\n').concat(err.message) : err.stack)
    )
    process.exit(1)
  })
