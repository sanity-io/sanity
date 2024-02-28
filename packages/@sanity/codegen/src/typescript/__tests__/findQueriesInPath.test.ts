import path from 'node:path'

import {describe, expect, test} from '@jest/globals'
import {lastValueFrom} from 'rxjs'

import {findQueriesInPath} from '../findQueriesInPath'

describe('findQueriesInPath', () => {
  test('should throw an error if the query name already exists', async () => {
    const observable = findQueriesInPath({
      path: path.join(__dirname, 'fixtures', '{source1,source2}.ts'),
    })
    const result = await lastValueFrom(observable)
    expect(result.error?.message).toMatch(/Duplicate query name found:/)
  })
})
