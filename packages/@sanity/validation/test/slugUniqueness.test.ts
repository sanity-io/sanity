import {type SanityClient} from '@sanity/client'
import {Schema} from '@sanity/schema'
import {builtinTypes} from '@sanity/schema/_internal'
import {type SlugIsUniqueValidator} from '@sanity/types'
import {describe, expect, it, vi} from 'vitest'

import {validateDocument, validationMarkerCodes} from '../src'
import {inferFromSchema} from '../src/_internal'

const builtinSchema = Schema.compile({name: 'studio', types: builtinTypes})
const studioBuiltinSchema = inferFromSchema(Schema.compile({name: 'studio', types: builtinTypes}))
const document = {
  _id: 'article-id',
  _type: 'article',
  _rev: 'revision',
  _createdAt: '2026-01-01T00:00:00.000Z',
  _updatedAt: '2026-01-01T00:00:00.000Z',
  slug: {_type: 'slug', current: 'hello'},
}

function createSchema(
  mode: 'headless' | 'studio',
  type: string,
  isUnique?: SlugIsUniqueValidator,
  override?: SlugIsUniqueValidator,
) {
  const schema = Schema.compile({
    name: 'test',
    parent: mode === 'studio' ? studioBuiltinSchema : builtinSchema,
    types: [
      {name: 'customSlug', type: 'slug', options: {isUnique}},
      {name: 'nestedSlug', type: 'customSlug'},
      {
        name: 'customObject',
        type: 'object',
        options: {isUnique},
        fields: [{name: 'current', type: 'string'}],
      },
      {
        name: 'article',
        type: 'document',
        fields: [
          {
            name: 'slug',
            type,
            ...(override || type === 'slug' ? {options: {isUnique: override || isUnique}} : {}),
          },
        ],
      },
    ],
  })
  return mode === 'studio' ? inferFromSchema(schema) : schema
}

function createClient(unique: boolean) {
  const fetch = vi.fn(async () => unique)
  const client = {fetch, withConfig: () => client} as unknown as SanityClient
  return {client, fetch}
}

describe.each(['headless', 'studio'] as const)('%s slug uniqueness', (mode) => {
  it.each([true, false])(
    'does not run slug uniqueness on an ordinary object with customValidation=%s',
    async (customValidation) => {
      const isUnique = vi.fn(async () => false)
      const {client, fetch} = createClient(false)
      const result = await validateDocument({
        client,
        customValidation,
        document: {...document, slug: {_type: 'customObject', current: 'hello'}},
        schema: createSchema(mode, 'customObject', isUnique),
      })

      expect(result).toEqual({status: 'passed', markers: []})
      expect(isUnique).not.toHaveBeenCalled()
      expect(fetch).not.toHaveBeenCalled()
    },
  )

  it.each(['slug', 'customSlug', 'nestedSlug'])(
    'uses the custom callback on %s instead of the default query',
    async (type) => {
      const isUnique = vi.fn(async () => true)
      const {client, fetch} = createClient(false)
      const result = await validateDocument({
        client,
        document,
        schema: createSchema(mode, type, isUnique),
      })

      expect(result).toEqual({status: 'passed', markers: []})
      expect(isUnique).toHaveBeenCalledOnce()
      expect(isUnique).toHaveBeenCalledWith(
        'hello',
        expect.objectContaining({document, path: ['slug'], defaultIsUnique: expect.any(Function)}),
      )
      expect(fetch).not.toHaveBeenCalled()
    },
  )

  it('uses a field override instead of the inherited callback', async () => {
    const inheritedIsUnique = vi.fn(async () => true)
    const override = vi.fn(async () => false)
    const {client, fetch} = createClient(true)
    const result = await validateDocument({
      client,
      document,
      schema: createSchema(mode, 'nestedSlug', inheritedIsUnique, override),
    })

    expect(result.status).toBe('failed')
    expect(result.markers).toEqual([
      expect.objectContaining({code: validationMarkerCodes.slugNotUnique, path: ['slug']}),
    ])
    expect(override).toHaveBeenCalledOnce()
    expect(inheritedIsUnique).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
  })

  it.each(['slug', 'customSlug', 'nestedSlug'])(
    'skips custom uniqueness on %s when custom validation is disabled',
    async (type) => {
      const isUnique = vi.fn(async () => true)
      const {client, fetch} = createClient(false)
      const result = await validateDocument({
        client,
        customValidation: false,
        document,
        schema: createSchema(mode, type, isUnique),
      })

      expect(result).toEqual({status: 'notEvaluated', markers: []})
      expect(isUnique).not.toHaveBeenCalled()
      expect(fetch).not.toHaveBeenCalled()
    },
  )

  it.each(['slug', 'customSlug', 'nestedSlug'])(
    'keeps default uniqueness on %s when there is no custom callback',
    async (type) => {
      const {client, fetch} = createClient(false)
      const result = await validateDocument({
        client,
        customValidation: false,
        document,
        schema: createSchema(mode, type),
      })

      expect(result.status).toBe('failed')
      expect(result.markers).toEqual([
        expect.objectContaining({code: validationMarkerCodes.slugNotUnique, path: ['slug']}),
      ])
      expect(fetch).toHaveBeenCalledOnce()
    },
  )
})
