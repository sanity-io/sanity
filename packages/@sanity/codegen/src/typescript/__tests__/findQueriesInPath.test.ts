import assert from 'node:assert'
import path from 'node:path'

import {describe, expect, test} from '@jest/globals'

import {findQueriesInPath} from '../findQueriesInPath'

describe('findQueriesInPath', () => {
  test('should throw an error if the query name already exists', async () => {
    const stream = findQueriesInPath({
      path: path.join(__dirname, 'fixtures', '{source1,source2}.ts'),
    })
    await stream.next()
    const result = await stream.next()
    if (!result.value) {
      throw new Error('Expected to yield a result')
    }
    expect(result.value.type).toBe('error')
    assert(result.value.type === 'error') // workaround for TS
    expect(result.value.error.message).toMatch(/Duplicate query name found:/)
  })
})
