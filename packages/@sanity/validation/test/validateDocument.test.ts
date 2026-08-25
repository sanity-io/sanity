import {type SanityClient} from '@sanity/client'
import {Schema as SchemaBuilder} from '@sanity/schema'
import {builtinTypes} from '@sanity/schema/_internal'
import {type Rule, type SanityDocument, type SchemaTypeDefinition} from '@sanity/types'
import {of} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {validateDocument} from '../src'

const builtinSchema = SchemaBuilder.compile({name: 'studio', types: builtinTypes})

function createSchema(types: SchemaTypeDefinition[]) {
  return SchemaBuilder.compile({
    name: 'test',
    parent: builtinSchema,
    types,
  })
}

function createDocument(value: Record<string, unknown>): SanityDocument {
  return {
    _createdAt: '2026-01-01T00:00:00.000Z',
    _id: 'test-document',
    _rev: 'revision',
    _updatedAt: '2026-01-01T00:00:00.000Z',
    ...value,
  } as SanityDocument
}

function createMockClient(omitted: {id: string; reason: 'existence' | 'permission'}[] = []) {
  const fetch = vi.fn(async () => null)
  const request = vi.fn(() => of({omitted}))
  const client = {
    fetch,
    getDataUrl: vi.fn(() => '/doc'),
    observable: {request},
    withConfig: vi.fn(() => client),
  } as unknown as SanityClient

  return {client, fetch, request}
}

describe('validateDocument', () => {
  it('returns validation and unknown-field markers without mutating the document', async () => {
    const schema = createSchema([
      {
        name: 'article',
        type: 'document',
        fields: [
          {
            name: 'title',
            type: 'string',
            validation: (rule: Rule) => rule.min(80),
          },
        ],
      },
    ])
    const document = createDocument({_type: 'article', title: 'Short', unexpected: true})
    const before = structuredClone(document)
    const {client} = createMockClient()

    const markers = await validateDocument({client, document, schema})

    expect(markers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          level: 'error',
          message: 'Must be at least 80 characters long',
          path: ['title'],
        }),
        expect.objectContaining({
          level: 'warning',
          message: "Field 'unexpected' does not exist on type 'article'",
          path: ['unexpected'],
        }),
      ]),
    )
    expect(document).toEqual(before)
  })

  it('provides the configured client to executable custom validators', async () => {
    const schema = createSchema([
      {
        name: 'article',
        type: 'document',
        fields: [
          {
            name: 'title',
            type: 'string',
            validation: (rule: Rule) =>
              rule.custom(async (_value, context) => {
                await context.getClient({apiVersion: '2026-01-01'}).fetch('*[]')
                return true as const
              }),
          },
        ],
      },
    ])
    const {client, fetch} = createMockClient()

    await expect(
      validateDocument({
        client,
        document: createDocument({_type: 'article', title: 'Hello'}),
        schema,
      }),
    ).resolves.toEqual([])
    expect(client.withConfig).toHaveBeenCalledWith({apiVersion: '2026-01-01'})
    expect(fetch).toHaveBeenCalledWith('*[]')
  })

  it('honors maxFetchConcurrency values across validation calls', async () => {
    const schema = createSchema([
      {
        name: 'article',
        type: 'document',
        fields: ['first', 'second', 'third'].map((name) => ({
          name,
          type: 'string',
          validation: (rule: Rule) =>
            rule.custom(async (_value, context) => {
              await context.getClient({apiVersion: '2026-01-01'}).fetch('*[]')
              return true as const
            }),
        })),
      },
    ])
    const document = createDocument({
      _type: 'article',
      first: 'one',
      second: 'two',
      third: 'three',
    })

    const validateWithConcurrency = async (maxFetchConcurrency: number) => {
      let active = 0
      let peak = 0
      const client = {
        fetch: async () => {
          active += 1
          peak = Math.max(peak, active)
          await new Promise((resolve) => setTimeout(resolve, 5))
          active -= 1
          return null
        },
        withConfig: () => client,
      } as unknown as SanityClient

      await validateDocument({
        client,
        document,
        getDocumentExists: async () => true,
        maxFetchConcurrency,
        schema,
      })

      return peak
    }

    await expect(validateWithConcurrency(1)).resolves.toBe(1)
    await expect(validateWithConcurrency(2)).resolves.toBe(2)
  })

  it.each([0, -1, NaN, 1.5, Infinity])(
    'rejects invalid maxFetchConcurrency value %s',
    (maxFetchConcurrency) => {
      const {client} = createMockClient()

      const validate = () =>
        validateDocument({
          client,
          document: createDocument({_type: 'article'}),
          maxFetchConcurrency,
          schema: createSchema([{name: 'article', type: 'document', fields: []}]),
        })

      expect(validate).toThrow(RangeError)
      expect(validate).toThrow('`maxFetchConcurrency` must be a positive integer')
    },
  )

  it('uses an explicit reference existence lookup when provided', async () => {
    const schema = createSchema([
      {
        name: 'article',
        type: 'document',
        fields: [{name: 'author', type: 'reference', to: [{type: 'author'}]}],
      },
      {name: 'author', type: 'document', fields: [{name: 'name', type: 'string'}]},
    ])
    const getDocumentExists = vi.fn(async () => false)
    const {client, request} = createMockClient()

    const markers = await validateDocument({
      client,
      document: createDocument({_type: 'article', author: {_ref: 'author-id', _type: 'reference'}}),
      getDocumentExists,
      schema,
    })

    expect(markers).toEqual([
      expect.objectContaining({
        level: 'error',
        message: 'Referenced document must be published',
        path: ['author'],
      }),
    ])
    expect(getDocumentExists).toHaveBeenCalledWith({id: 'author-id'})
    expect(request).not.toHaveBeenCalled()
  })

  it('batches reference existence checks through the configured client by default', async () => {
    const schema = createSchema([
      {
        name: 'article',
        type: 'document',
        fields: [{name: 'author', type: 'reference', to: [{type: 'author'}]}],
      },
      {name: 'author', type: 'document', fields: [{name: 'name', type: 'string'}]},
    ])
    const {client, request} = createMockClient()

    await expect(
      validateDocument({
        client,
        document: createDocument({
          _type: 'article',
          author: {_ref: 'author-id', _type: 'reference'},
        }),
        schema,
      }),
    ).resolves.toEqual([])
    expect(request).toHaveBeenCalledOnce()
  })

  it('limits concurrent custom validators', async () => {
    let active = 0
    let peak = 0
    const schema = createSchema([
      {
        name: 'article',
        type: 'document',
        fields: [{name: 'items', type: 'array', of: [{type: 'item'}]}],
      },
      {
        name: 'item',
        type: 'object',
        fields: [
          {
            name: 'value',
            type: 'string',
            validation: (rule: Rule) =>
              rule.custom(async () => {
                active += 1
                peak = Math.max(peak, active)
                await new Promise((resolve) => setTimeout(resolve, 5))
                active -= 1
                return true as const
              }),
          },
        ],
      },
    ])
    const {client} = createMockClient()

    const document = createDocument({
      _type: 'article',
      items: Array.from({length: 6}, (_, index) => ({
        _key: String(index),
        _type: 'item',
        value: String(index),
      })),
    })

    const validateWithConcurrency = async (maxCustomValidationConcurrency: number) => {
      active = 0
      peak = 0
      await validateDocument({
        client,
        document,
        maxCustomValidationConcurrency,
        schema,
      })
      return peak
    }

    await expect(validateWithConcurrency(1)).resolves.toBe(1)
    await expect(validateWithConcurrency(2)).resolves.toBe(2)
  })
})
