import {defineType, type Schema} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {createSchema} from '../../../schema/createSchema'
import {getSearchableTypes} from '../getSearchableTypes'

const getSearchableTypeNames = (schema: Schema, explicitlyAllowedTypes?: string[]) =>
  getSearchableTypes(schema, explicitlyAllowedTypes)
    .map((type) => type.name)
    .sort()

describe('getSearchableTypes', () => {
  it('finds no searchable types in an empty schema', () => {
    const schema = createSchema({
      name: 'default',
      types: [],
    })

    const searchable = getSearchableTypeNames(schema)
    expect(searchable).toEqual([])
  })

  it('finds all non-core document types by default', () => {
    const schema = createSchema({
      name: 'default',
      types: [
        defineType({name: 'author', type: 'document', fields: [{name: 'name', type: 'string'}]}),
        defineType({name: 'address', type: 'object', fields: [{name: 'street', type: 'string'}]}),
      ],
    })

    const searchable = getSearchableTypeNames(schema)
    expect(searchable).toEqual(['author'])
  })

  it('allows "preview url secrets"', () => {
    const schema = createSchema({
      name: 'default',
      types: [
        defineType({
          name: 'sanity.previewUrlSecret',
          type: 'document',
          fields: [{name: 'key', type: 'string'}],
        }),
      ],
    })

    const searchable = getSearchableTypeNames(schema)
    expect(searchable).toEqual(['sanity.previewUrlSecret'])
  })

  it('allows explicitly allowing certain types, if sanity types', () => {
    const schema = createSchema({
      name: 'default',
      types: [],
    })

    const searchable = getSearchableTypeNames(schema, ['sanity.imageAsset', 'sanity.fileAsset'])
    expect(searchable).toEqual(['sanity.fileAsset', 'sanity.imageAsset'])
  })

  it('allows explicitly allowing certain types, does not include non-existant ones', () => {
    const schema = createSchema({
      name: 'default',
      types: [],
    })

    const searchable = getSearchableTypeNames(schema, ['foobar', 'sanity.imageAsset'])
    expect(searchable).toEqual(['sanity.imageAsset'])
  })

  it('allows explicitly allowing certain types, if object types', () => {
    const schema = createSchema({
      name: 'default',
      types: [
        defineType({
          name: 'wasPreviouslyADocument',
          type: 'object',
          fields: [{name: 'name', type: 'string'}],
        }),
        defineType({
          name: 'myLink',
          type: 'string',
        }),
      ],
    })

    const searchable = getSearchableTypeNames(schema, ['wasPreviouslyADocument', 'myLink'])
    expect(searchable).toEqual(['wasPreviouslyADocument'])
  })
})
