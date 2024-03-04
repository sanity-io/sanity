import {describe, expect, test} from '@jest/globals'
import {lastValueFrom} from 'rxjs'

import {findQueriesInPath} from '../findQueriesInPath'

describe('findQueriesInPath', () => {
  test('should throw an error if the query name already exists', async () => {
    const observable = findQueriesInPath({path: './src/typescript/__tests__/fixtures/*.ts'})
    try {
      const result = await lastValueFrom(observable)
      // eslint-disable-next-line no-negated-condition
      if (result.error !== undefined) {
        expect(result.error.message).toMatch(/Duplicate query name found:/)
      } else {
        throw new Error('Expected an error due to duplicate query names, but none was thrown.')
      }
    } catch (error) {
      throw new Error('Expected an error due to duplicate query names, but none was thrown.')
    }
  })
})
