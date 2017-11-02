#!/usr/bin/env node
/* eslint-disable no-var, no-console, no-process-exit, prefer-template */

/**
 * ┌────────────────┐
 * │                │
 * │ NO ES6 IN HERE │
 * │ !NOT COMPILED! │
 * │                │
 * └────────────────┘
 */

var nodeVersion = Number(process.version.replace(/^v/i, '').split('.', 2)[0])

if (nodeVersion < 6) {
  console.error('ERROR: Node.js version 6 or higher required. You are running ' + process.version)
  process.exit(1)
} else {
  require('../lib/cli')()
}
