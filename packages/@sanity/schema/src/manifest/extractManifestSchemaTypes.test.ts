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

describe('extractManifestSchemaTypes versions', () => {
  test('keeps `versions` on a document type and on types extending it', () => {
    const [settings, siteSettings] = extract([
      {
        name: 'settings',
        type: 'document',
        liveEdit: true,
        versions: [],
        fields: [{name: 'title', type: 'string'}],
      },
      {name: 'siteSettings', type: 'settings'},
    ])

    expect(settings).toMatchObject({name: 'settings', liveEdit: true, versions: []})
    expect(siteSettings).toMatchObject({name: 'siteSettings', versions: []})
  })

  test('keeps the listed version kinds', () => {
    const [banner] = extract([
      {
        name: 'banner',
        type: 'document',
        versions: ['variants'],
        fields: [{name: 'heading', type: 'string'}],
      },
    ])

    expect(banner).toMatchObject({name: 'banner', versions: ['variants']})
  })

  test('omits `versions` when the type does not set it', () => {
    const [article] = extract([
      {name: 'article', type: 'document', fields: [{name: 'heading', type: 'string'}]},
    ])

    expect(article).not.toHaveProperty('versions')
  })
})
