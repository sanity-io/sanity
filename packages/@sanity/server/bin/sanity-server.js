#!/usr/bin/env node
const pkg = require('../package.json')

// @todo Figure out a better way to detect if we're running in "development mode"
const serverDevMode = Boolean(pkg._id) === false
const appDevMode = process.argv.indexOf('--dev') !== -1
const port = process.env.PORT || 3333 // eslint-disable-line no-process-env

if (serverDevMode) {
  // eslint-disable-next-line import/no-unassigned-import
  require('@babel/register')
}

const target = appDevMode ? 'devServer' : 'prodServer'
const sourceFolder = serverDevMode ? '../src/' : '../lib/'

// eslint-disable-next-line import/no-dynamic-require
const getServer = require(sourceFolder + target).default

getServer().listen(port)
