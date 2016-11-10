#!/usr/bin/env node

/**
 * ┌────────────────┐
 * │                │
 * │ NO ES6 IN HERE │
 * │ !NOT COMPILED! │
 * │                │
 * └────────────────┘
 */

var nodeVersion = Number(process.version.replace(/^v/i, '').split('.', 2)[0])

if (nodeVersion < 4) {
  console.error('ERROR: Node.js version 4 or higher required. You are running ' + process.version)
  process.exit(1)
} else {
  require('../lib/cli')()
}
