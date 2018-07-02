/* eslint-disable no-var, no-console, no-process-exit, prefer-template */

/**
 * ┌────────────────┐
 * │                │
 * │ WEBPACK ENTRY  │
 * │ NO ES6 IN HERE │
 * │                │
 * └────────────────┘
 */

const nodeVersion = Number(process.version.replace(/^v/i, '').split('.', 2)[0])
if (nodeVersion < 6) {
  console.error('ERROR: Node.js version 6 or higher required. You are running ' + process.version)
  process.exit(1)
}

if (process.version === 'v8.1.0' || process.version === 'v8.1.1') {
  console.error('ERROR: Node.js v8.1.0 and v8.1.1 has a bug that prevents the Sanity CLI')
  console.error('from receiving input. Please upgrade to a newer version of Node.js.')
  process.exit(1)
}

const path = require('path')
const runCli = require('../lib/cli')

runCli(path.join(__dirname, '..'))
