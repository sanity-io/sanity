import assert from 'node:assert'
import path from 'node:path'

import {describe, expect, test} from 'vitest'

import {findQueriesInPath} from '../findQueriesInPath'

describe('findQueriesInPath', () => {
  test('Can find queries in path', async () => {
    const stream = findQueriesInPath({
      path: path.join('**', 'typescript', '__tests__', 'fixtures', 'source1.ts'),
    })
    const res = []
    for await (const result of stream) {
      res.push(result)
    }
    expect(res.length).toBe(1)
    expect(res[0].type).toBe('queries')
    assert(res[0].type === 'queries') // workaround for TS
    expect(res[0].queries.length).toBe(1)
    // filename can be either of these two
    // depending on whether the test is run from the monorepo root or from the package root
    expect(
      res[0].filename === 'src/typescript/__tests__/fixtures/source1.ts' ||
        res[0].filename === 'packages/@sanity/codegen/src/typescript/__tests__/fixtures/source1.ts',
    ).toBe(true)
    expect(res[0].queries[0].name).toBe('postQuery')
    expect(res[0].queries[0].result).toBe('*[_type == "author"]')
  })
  test('should throw an error if the query name already exists', async () => {
    const stream = findQueriesInPath({
      path: path.join('**', 'fixtures', '{source1,source2}.ts'),
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

  test('can find and handle .astro files', async () => {
    const stream = findQueriesInPath({
      path: [path.join('**', 'typescript', '__tests__', 'fixtures', '*.astro')],
    })
    const res = []
    for await (const result of stream) {
      res.push(result)
    }
    expect(res.length).toBe(1)
    expect(res[0].type).toBe('queries')
    assert(res[0].type === 'queries') // workaround for TS
    expect(res[0].queries.length).toBe(1)
  })
})
