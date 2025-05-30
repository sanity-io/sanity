import {assert, describe, expect, test} from 'vitest'

import {type EncodedNamedType} from '../../../@sanity/schema/src/descriptors/types'
import {builtinSchema, createSchema, DESCRIPTOR_CONVERTER} from '../../src/core/schema'

const findTypeInDesc = (
  name: string,
  descriptor: ReturnType<(typeof DESCRIPTOR_CONVERTER)['get']>,
) =>
  Object.values(descriptor.objectValues).find((val) => val.name === name) as
    | EncodedNamedType
    | undefined

describe('Built-in schema', () => {
  const descriptor = DESCRIPTOR_CONVERTER.get(builtinSchema)
  const findType = (name: string) => findTypeInDesc(name, descriptor)

  test('core types', () => {
    const obj = findType('object')
    assert(obj)
    expect(obj.typeDef.jsonType).toBe('object')
    expect(obj.typeDef.title).toBe('Object')
  })
})

describe('Custom types', () => {
  const schema = createSchema({
    name: 'schema',
    types: [
      {
        name: 'book',
        type: 'document',
        title: 'Book',

        fields: [
          {
            name: 'title',
            type: 'string',

            validation: (Rule: any) => Rule.required(),
          },
        ],
      },
    ],
  })

  const descriptor = DESCRIPTOR_CONVERTER.get(schema)
  const findType = (name: string) => findTypeInDesc(name, descriptor)

  test('sets required validation', () => {
    const book = findType('book')
    assert(book)
    assert(book.typeDef.fields)
    const title = book.typeDef.fields.find(({name}) => name === 'title')
    assert(title)
    assert(title.typeDef.validation)
    expect(title.typeDef.validation).toHaveLength(1)
    expect(title.typeDef.validation[0].required).toBe(true)
  })
})
