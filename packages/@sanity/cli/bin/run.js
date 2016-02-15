#!/usr/bin/env node
/* eslint-disable no-console, prefer-arrow-callback, no-process-exit */
require('babel-register')
const pkg = require('../package.json')
const checkLocalCli = require('../src/util/checkLocalCli').default

/**
 * Check if there is a `package.json` file in the current directory, and it if contains
 * a @sanity/cli-dependency. If so, use that over the globally installed version, in order
 * to do things in line with the Sanity version currently being used by this project
 */
checkLocalCli(process.cwd()).then(function (localCli) {
  if (localCli) {
    // The local CLI exists, warn the user that we are using it and run it
    console.log(`[Sanity] Local "${pkg.name}"-dependency found, using that over global version`)
    require(localCli).run(process.argv)
  } else {
    // No local CLI found, use global version
    require('./cli.js').run(process.argv)
  }
}).catch(function (err) {
  console.error(err.message)
  process.exit(1)
})
