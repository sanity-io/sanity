import {type Schema as SanitySchema} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {Schema} from '../legacy/Schema'
import {builtinTypes} from '../sanity/builtinTypes'
import {extractManifestSchemaTypes} from './extractManifestSchemaTypes'
import {type ManifestSchemaType} from './manifestTypes'

function extract(types: Record<string, unknown>[]): ManifestSchemaType[] {
  const schema = Schema.compile({
    name: 'studio',
    parent: Schema.compile({name: 'builtin', types: builtinTypes}),
    types,
  })
  return JSON.parse(JSON.stringify(extractManifestSchemaTypes(schema as SanitySchema)))
}

describe('extractManifestSchemaTypes preview', () => {
  test('serializes preview.select of a user type and drops prepare', () => {
    const [article] = extract([
      {
        name: 'article',
        type: 'document',
        fields: [
          {name: 'heading', type: 'string'},
          {name: 'category', type: 'string'},
        ],
        preview: {
          select: {title: 'heading', subtitle: 'category'},
          prepare: ({title}: {title: string}) => ({title: title.toUpperCase()}),
        },
      },
    ])

    expect(article.preview).toEqual({select: {title: 'heading', subtitle: 'category'}})
  })

  test('serializes the legacy array form of select as a record', () => {
    const [article] = extract([
      {
        name: 'article',
        type: 'document',
        fields: [{name: 'heading', type: 'string'}],
        preview: {select: ['heading']},
      },
    ])

    expect(article.preview).toEqual({select: {heading: 'heading'}})
  })

  test('serializes preview.select of nested object fields', () => {
    const [article] = extract([
      {
        name: 'article',
        type: 'document',
        fields: [
          {
            name: 'author',
            type: 'object',
            fields: [{name: 'name', type: 'string'}],
            preview: {select: {title: 'name'}},
          },
        ],
      },
    ])

    expect(article.fields?.[0].preview).toEqual({select: {title: 'name'}})
  })

  test('omits preview when the type does not declare one', () => {
    const [article] = extract([
      {
        name: 'article',
        type: 'document',
        fields: [
          {name: 'category', type: 'string'},
          {name: 'cover', type: 'image'},
          {name: 'details', type: 'object', fields: [{name: 'note', type: 'string'}]},
        ],
      },
    ])

    expect(article).not.toHaveProperty('preview')
    for (const field of article.fields ?? []) {
      expect(field).not.toHaveProperty('preview')
    }
  })

  test('omits preview when it has no select', () => {
    const [article] = extract([
      {
        name: 'article',
        type: 'document',
        fields: [{name: 'heading', type: 'string'}],
        preview: {prepare: () => ({title: 'static'})},
      },
    ])

    expect(article).not.toHaveProperty('preview')
  })
})
