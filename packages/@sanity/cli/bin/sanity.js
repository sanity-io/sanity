/* eslint-disable no-var, no-console, no-process-exit, prefer-template */

/**
 * ┌────────────────┐
 * │                │
 * │ WEBPACK ENTRY  │
 * │ NO ES6 IN HERE │
 * │                │
 * └────────────────┘
 */

var nodeVersion = Number(process.version.replace(/^v/i, '').split('.', 2)[0])
if (nodeVersion < 6) {
  console.error('ERROR: Node.js version 6 or higher required. You are running ' + process.version)
  process.exit(1)
}

var path = require('path')
var runCli = require('../lib/cli')
runCli(path.join(__dirname, '..'))
