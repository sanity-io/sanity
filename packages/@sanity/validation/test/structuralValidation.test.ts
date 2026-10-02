import {createClient} from '@sanity/client'
import {Schema as SchemaBuilder} from '@sanity/schema'
import {builtinTypes} from '@sanity/schema/_internal'
import {type Rule, type SanityDocument} from '@sanity/types'
import {describe, expect, it, vi} from 'vitest'

import {validateDocument, validationMarkerCodes} from '../src'
import {inferFromSchema} from '../src/_internal'
import {stringValidators} from '../src/validators/stringValidator'

const document: SanityDocument = {
  _id: 'article',
  _type: 'article',
  _rev: 'revision',
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
}

function createSchema(compiled: boolean, customValidator = vi.fn(() => true as const)) {
  const parent = SchemaBuilder.compile({name: 'builtins', types: builtinTypes})
  if (compiled) inferFromSchema(parent)
  const schema = SchemaBuilder.compile({
    name: 'test',
    parent,
    types: [
      {
        name: 'shortText',
        type: 'string',
        validation: (rule: Rule) => rule.required().min(10).custom(customValidator),
      },
      {
        name: 'article',
        type: 'document',
        fields: [
          {name: 'title', type: 'shortText'},
          {name: 'requiredText', type: 'shortText'},
          {name: 'author', type: 'reference', to: [{type: 'article'}]},
          {name: 'slug', type: 'slug'},
          {
            name: 'media',
            type: 'image',
            validation: (rule: Rule) => rule.media(customValidator),
          },
          {
            name: 'items',
            type: 'array',
            of: [{type: 'object', fields: [{name: 'title', type: 'shortText'}]}],
          },
        ],
      },
    ],
  })
  if (compiled) inferFromSchema(schema)
  return schema
}

describe.each([false, true])('structural validation (compiled rules: %s)', (compiled) => {
  it('skips content constraints, custom callbacks, and reference lookups', async () => {
    const customValidator = vi.fn(() => true as const)
    const schema = createSchema(compiled, customValidator)
    const getDocumentExists = vi.fn(async () => false)
    const minimum = vi.spyOn(stringValidators, 'min')
    try {
      await expect(
        validateDocument({
          schema,
          validationMode: 'structural',
          getDocumentExists,
          document: {
            ...document,
            title: 'short',
            author: {_type: 'reference', _ref: 'missing'},
            slug: {_type: 'slug', current: 'hello'},
            media: {_type: 'image', media: {_ref: 'media-library:library:missing'}},
          },
        }),
      ).resolves.toEqual({status: 'passed', markers: []})
      expect(minimum).not.toHaveBeenCalled()
      expect(customValidator).not.toHaveBeenCalled()
      expect(getDocumentExists).not.toHaveBeenCalled()
    } finally {
      minimum.mockRestore()
    }
  })

  it('preserves structural markers in nested objects and arrays', async () => {
    const schema = createSchema(compiled)
    const input = {
      ...document,
      title: 42,
      author: {_type: 'reference'},
      media: {_type: 'image'},
      extra: true,
      items: [{_key: 'one', title: 42, extra: true}],
    }
    const structural = await validateDocument({
      schema,
      document: input,
      validationMode: 'structural',
    })
    const full = await validateDocument({
      schema,
      document: input,
      client: createClient({
        projectId: 'test',
        dataset: 'test',
        apiVersion: '2025-02-19',
        useCdn: false,
      }),
    })
    const codes = new Set<string>([
      validationMarkerCodes.valueTypeMismatch,
      validationMarkerCodes.objectUnknownField,
      validationMarkerCodes.referenceInvalid,
      validationMarkerCodes.mediaInvalidReference,
    ])
    expect(structural.status).toBe('failed')
    expect(structural.markers).toEqual(full.markers.filter((marker) => codes.has(marker.code)))
    expect(structural.markers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({code: validationMarkerCodes.valueTypeMismatch, path: ['title']}),
        expect.objectContaining({code: validationMarkerCodes.referenceInvalid, path: ['author']}),
        expect.objectContaining({
          code: validationMarkerCodes.mediaInvalidReference,
          path: ['media'],
        }),
        expect.objectContaining({code: validationMarkerCodes.objectUnknownField, path: ['extra']}),
        expect.objectContaining({path: ['items', {_key: 'one'}, 'title']}),
        expect.objectContaining({path: ['items', {_key: 'one'}, 'extra']}),
      ]),
    )
  })

  it('keeps full validation as the default', async () => {
    const schema = createSchema(compiled)
    const options = {schema, document: {...document, title: 'short'}}
    const full = await validateDocument(options)
    expect(full.markers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({code: validationMarkerCodes.valueRequired}),
        expect.objectContaining({code: validationMarkerCodes.stringMinimumLength}),
      ]),
    )
    await expect(validateDocument({...options, validationMode: 'full'})).resolves.toEqual(full)
  })

  it('reports unknown document types', async () => {
    const result = await validateDocument({
      schema: createSchema(compiled),
      document: {...document, _type: 'missing'},
      validationMode: 'structural',
    })
    expect(result.markers).toEqual([
      expect.objectContaining({code: validationMarkerCodes.documentUnknownType}),
    ])
  })
})
