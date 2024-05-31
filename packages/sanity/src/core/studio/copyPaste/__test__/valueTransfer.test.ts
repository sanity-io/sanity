import {beforeEach, describe, expect, jest, test} from '@jest/globals'
import {type CopyActionResult} from 'sanity'

import {transferValue} from '../valueTransfer'
import {schema} from './schema'

beforeEach(() => {
  jest.resetModules()
  jest.clearAllMocks()
})

describe('transferValue', () => {
  test('can copy portable text field', () => {
    const docValue = {
      body: [
        {
          _key: 'someKey',
          _type: 'customNamedBlock',
          children: [{_key: 'someOtherKey', _type: 'span', text: 'Hello'}],
        },
      ],
    }
    const copyActionResult: CopyActionResult = {
      _type: 'copyResult',
      documentId: '123',
      documentType: 'author',
      schemaTypeName: 'author',
      path: ['bio'],
      docValue,
      isDocument: true,
      isArray: false,
      isObject: false,
    }
    const targetValue = transferValue(copyActionResult, {
      targetDocumentType: 'author',
      targetSchemaType: schema.get('author')!,
    })
    expect(targetValue).toEqual(docValue)
  })
})
