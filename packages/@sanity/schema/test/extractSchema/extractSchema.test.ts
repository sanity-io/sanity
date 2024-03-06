import assert from 'node:assert'

import {describe, expect, test} from '@jest/globals'

import {extractSchema} from '../../src/sanity/extractSchema'
import Block from './fixtures/block'

describe('Extract schema test', () => {
  test('Extracts  schema general', () => {
    const schemaDef = [
      {
        title: 'Valid document',
        name: 'validDocument',
        type: 'document',
        fields: [
          {
            title: 'Title',
            name: 'title',
            type: 'string',
          },
          {
            title: 'List',
            name: 'list',
            type: 'string',
            options: {
              list: ['a', 'b', 'c'],
            },
          },
          {
            title: 'Number',
            name: 'number',
            type: 'number',
          },
          {
            title: 'some other object',
            name: 'someInlinedObject',
            type: 'obj',
          },
          {
            title: 'Blocks',
            name: 'blocks',
            type: 'array',
            of: [{type: 'block'}],
          },
          {
            type: 'reference',
            name: 'other',
            to: {
              type: 'otherValidDocument',
            },
          },
          {
            type: 'reference',
            name: 'others',
            to: [
              {
                type: 'otherValidDocument',
              },
            ],
          },
        ],
      },
      Block,
      {
        title: 'Other valid document',
        name: 'otherValidDocument',
        type: 'document',
        fields: [
          {
            title: 'Title',
            name: 'title',
            type: 'string',
          },
        ],
      },
      {
        title: 'Obj',
        type: 'obj',
        name: 'object',
        fields: [
          {
            title: 'Field #1',
            name: 'field-1',
            type: 'string',
          },
          {
            title: 'Field #2',
            name: 'field-2',
            type: 'number',
          },
        ],
      },
    ]

    const extracted = extractSchema(schemaDef)
    expect(extracted).toHaveLength(4)
    expect(extracted[0].name).toEqual('validDocument')
    expect(extracted[0].type).toEqual('document')
    assert(extracted[0].type === 'document') // this is a workaround for TS https://github.com/DefinitelyTyped/DefinitelyTyped/issues/41179
    expect(Object.keys(extracted[0].attributes)).toStrictEqual([
      '_id',
      '_type',
      '_createdAt',
      '_updatedAt',
      '_rev',
      'title',
      'list',
      'number',
      'someInlinedObject',
      'blocks',
      'other',
      'others',
    ])

    // Check that the block type is extracted correctly, as an array
    expect(extracted[0].attributes.blocks.type).toEqual('objectAttribute')
    expect(extracted[0].attributes.blocks.value.type).toEqual('array')
    assert(extracted[0].attributes.blocks.value.type === 'array') // this is a workaround for TS
    expect(extracted[0].attributes.blocks.value.of.type).toEqual('object')
    assert(extracted[0].attributes.blocks.value.of.type === 'object') // this is a workaround for TS
    expect(Object.keys(extracted[0].attributes.blocks.value.of.attributes)).toStrictEqual([
      '_key',
      'level',
      'style',
      'listItem',
      'children',
      'markDefs',
    ])

    expect(extracted).toMatchSnapshot()
  })

  test('Can extract example studio', async () => {
    const schemaDef = await import('../../../schema/example/schema-def')
    const extracted = extractSchema(schemaDef.default.types)
    expect(extracted.length).toBeGreaterThan(0) // we don't really care about the exact number, just that it passes :+1:
  })
})
