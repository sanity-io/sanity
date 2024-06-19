// Integration test for the Node.js ESM runtime

import {strict as assert} from 'node:assert'

import {defineQuery} from 'groq/define'

assert.equal(typeof defineQuery, 'function')

assert.equal(defineQuery(`foo${'bar'}`), `foo${'bar'}`)
assert.equal(defineQuery(`${'bar'}`), `${'bar'}`)
assert.equal(defineQuery(``), ``)
assert.equal(defineQuery(`${'foo'}`), `${'foo'}`)
assert.equal(defineQuery(`${/foo/}bar`), `${/foo/}bar`)
assert.equal(defineQuery(`${'foo'}bar${347}`), `${'foo'}bar${347}`)
assert.equal(defineQuery(`${'foo'}bar${347}${/qux/}`), `${'foo'}bar${347}${/qux/}`)
assert.equal(defineQuery(`${'foo'}${347}qux`), `${'foo'}${347}qux`)
