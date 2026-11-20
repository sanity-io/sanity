import {defineField, defineType} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {createSchema} from '../../schema/createSchema'
import {_isCustomDocumentTypeDefinition} from '../schemaUtils'

describe('_isCustomDocumentTypeDefinition', () => {
  it('finds no custom document types in a schema that only has the built-in release types', () => {
    const schema = createSchema({name: 'default', types: []})

    expect(schema._original?.types.map((type) => type.name)).toContain('system.release')
    expect(schema._original?.types.some(_isCustomDocumentTypeDefinition)).toBe(false)
  })

  it('finds the document types the schema declares', () => {
    const schema = createSchema({
      name: 'default',
      types: [
        defineType({
          name: 'article',
          type: 'document',
          fields: [defineField({name: 'title', type: 'string'})],
        }),
      ],
    })

    expect(
      schema._original?.types.filter(_isCustomDocumentTypeDefinition).map((type) => type.name),
    ).toEqual(['article'])
  })
})
