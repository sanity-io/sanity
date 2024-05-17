'use strict'
// Integration test for the Node.js CJS runtime

const {strict: assert} = require('node:assert')

const groq = require('groq')

assert.equal(typeof groq, 'function')

// Ensure it's possible to check what version of groq is being used
const pkg = require('groq/package.json')

assert.equal(typeof pkg.version, 'string')

assert.equal(groq`foo${'bar'}`, `foo${'bar'}`)
assert.equal(groq`${'bar'}`, `${'bar'}`)
assert.equal(groq``, ``)
assert.equal(groq`${'foo'}`, `${'foo'}`)
assert.equal(groq`${/foo/}bar`, `${/foo/}bar`)
assert.equal(groq`${'foo'}bar${347}`, `${'foo'}bar${347}`)
assert.equal(groq`${'foo'}bar${347}${/qux/}`, `${'foo'}bar${347}${/qux/}`)
assert.equal(groq`${'foo'}${347}qux`, `${'foo'}${347}qux`)
