import {beforeEach, describe, expect, jest, test} from '@jest/globals'

import {resolveSchemaTypeForPath} from '../resolveSchemaTypeForPath'
import {schema} from './schema'

beforeEach(() => {
  jest.resetModules()
  jest.clearAllMocks()
})

describe('resolveSchemaTypeForPath', () => {
  test('can get schema type from path', () => {
    const authorSchema = schema.get('author')
    const path = ['bio']
    const schematype = resolveSchemaTypeForPath(authorSchema, path)
    expect(schematype).toEqual('array')
  })
})
