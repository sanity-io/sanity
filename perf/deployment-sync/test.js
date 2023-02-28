#!/usr/bin/env node
/**
 * Test local endpoint with example webhook payloads
 * See ./webhook-request-examples for canned payloads
 * Usage:
 * node test.js --service=github event=branch-created
 * node test.js --service=vercel event=test-studio-ready
 * node test.js --service=vercel event=test-studio-created
 *
 *  Note: requires node 18.0.0 or higher
 */

const {parseArgs} = require('node:util')

const {
  values: {service, event},
} = parseArgs({
  options: {
    service: {
      type: 'string',
      short: 's',
    },
    event: {
      type: 'string',
      short: 'e',
    },
  },
})

if (!service || !event) {
  console.error(
    'Usage: test.js --service=<service> --event=<event> \n' +
      'Example: node test.js --service=github event=branch-created'
  )
  process.exit(1)
}

const relativeFile = `./webhook-request-examples/${service}-${event}.json`
let example
try {
  // eslint-disable-next-line import/no-dynamic-require
  example = require(relativeFile)
} catch (error) {
  console.error(
    `Wrong service or event, could not resolve canned payload file from current working directory:\n${relativeFile}`
  )
  process.exit(1)
}

fetch(`http://localhost:3000/api/${service}-webhook-receive`, {
  method: 'POST',
  headers: {'Content-Type': 'application/json', ...example.headers},
  body: JSON.stringify(example.body),
})
