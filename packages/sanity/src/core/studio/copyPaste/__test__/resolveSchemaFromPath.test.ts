import {beforeEach, describe, expect, jest, test} from '@jest/globals'
import {type ReferenceSchemaType} from '@sanity/types'

import {resolveSchemaTypeForPath} from '../resolveSchemaTypeForPath'
import {schema} from './schema'

beforeEach(() => {
  jest.resetModules()
  jest.clearAllMocks()
})

describe('resolveSchemaTypeForPath', () => {
  test('can get schema type from path', () => {
    const authorSchema = schema.get('author')!
    const path = ['bestFriend']
    const schemaType = resolveSchemaTypeForPath(authorSchema, path) as ReferenceSchemaType
    expect(schema._validation).toHaveLength(0)
    expect(schemaType?.name).toEqual('reference')
    expect(schemaType?.jsonType).toEqual('object')
    expect(schemaType?.to[0].name).toEqual('author')
  })
})
