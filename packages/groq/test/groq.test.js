/* eslint-disable @typescript-eslint/no-var-requires */
const assert = require('assert')
const groq = require('../src/groq')

assert.equal(groq`foo${'bar'}`, `foo${'bar'}`)
assert.equal(groq`${'bar'}`, `${'bar'}`)
assert.equal(groq``, ``)
assert.equal(groq`${'foo'}`, `${'foo'}`)
assert.equal(groq`${/foo/}bar`, `${/foo/}bar`)
assert.equal(groq`${'foo'}bar${347}`, `${'foo'}bar${347}`)
assert.equal(groq`${'foo'}bar${347}${/qux/}`, `${'foo'}bar${347}${/qux/}`)
assert.equal(groq`${'foo'}${347}qux`, `${'foo'}${347}qux`)
