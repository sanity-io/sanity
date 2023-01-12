// Integration test for the Node.js ESM runtime

import {strict as assert} from 'node:assert'

import groq from 'groq'
// Ensure it's possible to check what version of groq being used
import pkg from 'groq/package.json' assert {type: 'json'}

assert.equal(typeof groq, 'function')
assert.equal(typeof pkg.version, 'string')

assert.equal(groq`foo${'bar'}`, `foo${'bar'}`)
assert.equal(groq`${'bar'}`, `${'bar'}`)
assert.equal(groq``, ``)
assert.equal(groq`${'foo'}`, `${'foo'}`)
assert.equal(groq`${/foo/}bar`, `${/foo/}bar`)
assert.equal(groq`${'foo'}bar${347}`, `${'foo'}bar${347}`)
assert.equal(groq`${'foo'}bar${347}${/qux/}`, `${'foo'}bar${347}${/qux/}`)
assert.equal(groq`${'foo'}${347}qux`, `${'foo'}${347}qux`)
