import {type SanityClient} from '@sanity/client'
import {Schema as SchemaBuilder} from '@sanity/schema'
import {builtinTypes, createSchemaFromManifestTypes} from '@sanity/schema/_internal'
import {
  type Rule,
  type SanityDocument,
  type SchemaTypeDefinition,
  type ValidationContext,
} from '@sanity/types'
import {of} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {
  validateDocument,
  type ValidateDocumentOptions,
  validateDocumentWithWorkspace,
  validationMarkerCodes,
} from '../src'
import {getFallbackLocaleSource} from '../src/_internal'

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
  const fetch = vi.fn(async (): Promise<unknown> => null)
  const request = vi.fn(() => of({omitted}))
  const client = {
    fetch,
    getDataUrl: vi.fn(() => '/doc'),
    observable: {request},
    withConfig: vi.fn(() => client),
  } as unknown as SanityClient

  return {client, fetch, request}
}

function validateMarkers(options: ValidateDocumentOptions) {
  return validateDocument(options).then(({markers}) => markers)
}

describe('validateDocument', () => {
  it('reports passed, failed, and not-evaluated document outcomes', async () => {
    const schema = createSchema([
      {
        name: 'article',
        type: 'document',
        fields: [
          {
            name: 'title',
            type: 'string',
            validation: (rule: Rule) => rule.required(),
          },
          {name: 'author', type: 'reference', to: [{type: 'author'}]},
        ],
      },
      {name: 'author', type: 'document', fields: []},
    ])

    await expect(
      validateDocument({
        document: createDocument({_type: 'article', title: 'Hello'}),
        schema,
      }),
    ).resolves.toEqual({status: 'passed', markers: []})

    await expect(
      validateDocument({document: createDocument({_type: 'article'}), schema}),
    ).resolves.toMatchObject({status: 'failed', markers: [expect.any(Object)]})

    await expect(
      validateDocument({
        document: createDocument({
          _type: 'article',
          title: 'Hello',
          author: {_type: 'reference', _ref: 'author-id'},
        }),
        schema,
      }),
    ).resolves.toEqual({
      status: 'notEvaluated',
      markers: [],
    })
  })

  it('skips user validators without skipping engine-provided validators', async () => {
    const customValidator = vi.fn(() => true as const)
    const schema = createSchema([
      {
        name: 'article',
        type: 'document',
        fields: [
          {name: 'title', type: 'string', validation: (rule: Rule) => rule.custom(customValidator)},
        ],
      },
    ])

    const result = await validateDocument({
      customValidation: false,
      document: createDocument({_type: 'article', title: 'Hello', unexpected: true}),
      schema,
    })

    expect(result.status).toBe('failed')
    expect(result.markers).toEqual([
      expect.objectContaining({code: validationMarkerCodes.objectUnknownField}),
    ])
    expect(customValidator).not.toHaveBeenCalled()
  })

  it('reports field rules as not evaluated when custom validation is disabled', async () => {
    const customValidator = vi.fn(() => true as const)
    const schema = createSchema([
      {
        name: 'article',
        type: 'document',
        fields: [{name: 'title', type: 'string'}],
        validation: (rule: Rule) =>
          rule.fields({title: (fieldRule) => fieldRule.custom(customValidator)}),
      },
    ])

    const result = await validateDocument({
      customValidation: false,
      document: createDocument({_type: 'article', title: 'Hello'}),
      schema,
    })

    expect(result).toEqual({
      status: 'notEvaluated',
      markers: [],
    })
    expect(customValidator).not.toHaveBeenCalled()
  })

  it('disables custom validators when no client is provided', async () => {
    const pureValidator = vi.fn(() => true as const)
    const clientValidator = vi.fn((_value: unknown, context: ValidationContext) => {
      context.getClient({apiVersion: '2026-01-01'})
      return true as const
    })
    const schema = createSchema([
      {
        name: 'article',
        type: 'document',
        fields: [
          {name: 'pure', type: 'string', validation: (rule: Rule) => rule.custom(pureValidator)},
          {
            name: 'remote',
            type: 'string',
            validation: (rule: Rule) => rule.custom(clientValidator),
          },
        ],
      },
    ])

    const result = await validateDocument({
      document: createDocument({_type: 'article', pure: 'yes', remote: 'yes'}),
      schema,
    })

    expect(result).toEqual({
      status: 'notEvaluated',
      markers: [],
    })
    expect(pureValidator).not.toHaveBeenCalled()
    expect(clientValidator).not.toHaveBeenCalled()
  })

  it('reports client-dependent media validation as not evaluated without a client', async () => {
    const mediaValidator = vi.fn(() => true as const)
    const schema = createSchema([
      {
        name: 'article',
        type: 'document',
        fields: [
          {
            name: 'media',
            type: 'object',
            fields: [{name: '_ref', type: 'string'}],
          },
        ],
        validation: (rule: Rule) => rule.media(mediaValidator),
      },
    ])

    await expect(
      validateDocument({
        document: createDocument({
          _type: 'article',
          media: {_ref: 'media-library:library-id:asset-id'},
        }),
        schema,
      }),
    ).resolves.toEqual({
      status: 'notEvaluated',
      markers: [],
    })
    expect(mediaValidator).not.toHaveBeenCalled()
  })

  it('skips unavailable manifest validators when custom validation is disabled', async () => {
    const schema = createSchemaFromManifestTypes({
      name: 'test',
      types: [
        {
          name: 'article',
          type: 'document',
          fields: [
            {
              name: 'title',
              type: 'string',
              validation: [{level: 'warning', rules: [{flag: 'custom'}]}],
            },
          ],
        },
      ],
    })
    const {client} = createMockClient()

    const document = createDocument({_type: 'article', title: 'Hello'})

    await expect(
      validateDocument({client, customValidation: false, document, schema}),
    ).resolves.toEqual({
      status: 'notEvaluated',
      markers: [],
    })

    await expect(validateDocument({client, document, schema})).resolves.toMatchObject({
      status: 'failed',
      markers: [expect.objectContaining({code: validationMarkerCodes.validationException})],
    })
  })

  it('keeps local slug and reference checks in no-network mode', async () => {
    const schema = createSchema([
      {
        name: 'article',
        type: 'document',
        fields: [
          {name: 'author', type: 'reference', to: [{type: 'author'}]},
          {name: 'slug', type: 'slug'},
        ],
      },
      {name: 'author', type: 'document', fields: []},
    ])

    const result = await validateDocument({
      customValidation: false,
      document: createDocument({_type: 'article', author: 'invalid', slug: {current: ''}}),
      schema,
    })

    expect(result.status).toBe('failed')
    expect(result.markers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({code: validationMarkerCodes.referenceInvalid}),
        expect.objectContaining({code: validationMarkerCodes.slugMissingCurrent}),
      ]),
    )
  })

  it('runs default slug uniqueness without running a custom uniqueness callback', async () => {
    const customIsUnique = vi.fn(async () => true)
    const schema = createSchema([
      {
        name: 'article',
        type: 'document',
        fields: [
          {name: 'defaultSlug', type: 'slug'},
          {name: 'customSlug', type: 'slug', options: {isUnique: customIsUnique}},
        ],
      },
    ])
    const {client, fetch} = createMockClient()
    fetch.mockResolvedValue(true)

    const result = await validateDocument({
      client,
      customValidation: false,
      document: createDocument({
        _type: 'article',
        defaultSlug: {current: 'default'},
        customSlug: {current: 'custom'},
      }),
      schema,
    })

    expect(result).toEqual({status: 'notEvaluated', markers: []})
    expect(fetch).toHaveBeenCalledOnce()
    expect(customIsUnique).not.toHaveBeenCalled()
  })

  it('skips network checks while honoring an explicit reference existence callback', async () => {
    const getDocumentExists = vi.fn(async () => true)
    const schema = createSchema([
      {
        name: 'article',
        type: 'document',
        fields: [
          {name: 'author', type: 'reference', to: [{type: 'author'}]},
          {name: 'slug', type: 'slug'},
        ],
      },
      {name: 'author', type: 'document', fields: []},
    ])

    const result = await validateDocument({
      customValidation: false,
      document: createDocument({
        _type: 'article',
        author: {_ref: 'author-id', _type: 'reference'},
        slug: {current: 'hello'},
      }),
      getDocumentExists,
      schema,
    })

    expect(getDocumentExists).toHaveBeenCalledWith({id: 'author-id'})
    expect(result).toEqual({
      status: 'notEvaluated',
      markers: [],
    })
  })

  it('preserves workspace validation behavior through the compatibility helper', async () => {
    const schema = createSchema([
      {
        name: 'article',
        type: 'document',
        fields: [
          {
            name: 'title',
            type: 'string',
            validation: (rule: Rule) => rule.required().min(10),
          },
        ],
      },
    ])
    const document = createDocument({_type: 'article', title: 'Short'})
    const {client} = createMockClient()
    const fallbackI18n = getFallbackLocaleSource()
    const i18n = {...fallbackI18n, t: vi.fn(fallbackI18n.t)}
    const workspace = {getClient: () => client, i18n, schema}

    const [headlessMarkers, workspaceMarkers] = await Promise.all([
      validateMarkers({client, document, schema}),
      // oxlint-disable-next-line typescript/no-deprecated -- explicitly covers compatibility API
      validateDocumentWithWorkspace({document, workspace}),
    ])

    expect(workspaceMarkers).toEqual(headlessMarkers)
    expect(i18n.t).toHaveBeenCalledWith('validation:string.minimum-length', {minLength: 10})
  })

  it('disables user validators through the workspace compatibility helper', async () => {
    const customValidator = vi.fn(() => 'Failed')
    const schema = createSchema([
      {
        name: 'article',
        type: 'document',
        fields: [
          {name: 'title', type: 'string', validation: (rule: Rule) => rule.custom(customValidator)},
        ],
      },
    ])
    const document = createDocument({_type: 'article', title: 'Title'})
    const {client} = createMockClient()
    const workspace = {
      getClient: () => client,
      i18n: getFallbackLocaleSource(),
      schema,
    }

    await expect(
      // oxlint-disable-next-line typescript/no-deprecated -- explicitly covers compatibility API
      validateDocumentWithWorkspace({customValidation: false, document, workspace}),
    ).resolves.toEqual([])
    expect(customValidator).not.toHaveBeenCalled()
  })

  it('defaults workspace validation to the studio environment', async () => {
    const schema = createSchema([])
    const document = createDocument({_type: 'missing'})
    const {client} = createMockClient()
    const workspace = {
      getClient: () => client,
      i18n: getFallbackLocaleSource(),
      schema,
    }
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    try {
      // oxlint-disable-next-line typescript/no-deprecated -- explicitly covers compatibility API
      await expect(validateDocumentWithWorkspace({document, workspace})).resolves.toEqual([])
      await expect(validateMarkers({client, document, schema})).resolves.toEqual([
        expect.objectContaining({
          level: 'warning',
          message: "Could not find schema type for type 'missing', skipping validation",
        }),
      ])
      expect(warnSpy).toHaveBeenCalledWith(
        'Schema type for object type "%s" not found, skipping validation',
        'missing',
      )
    } finally {
      warnSpy.mockRestore()
    }
  })

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

    const markers = await validateMarkers({client, document, schema})

    expect(markers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: validationMarkerCodes.stringMinimumLength,
          details: {actualLength: 5, minimumLength: 80},
          level: 'error',
          message: 'Must be at least 80 characters long',
          path: ['title'],
        }),
        expect.objectContaining({
          code: validationMarkerCodes.objectUnknownField,
          details: {fieldName: 'unexpected', typeName: 'article'},
          level: 'warning',
          message: "Field 'unexpected' does not exist on type 'article'",
          path: ['unexpected'],
        }),
      ]),
    )
    expect(document).toEqual(before)
    expect(markers.every((marker) => typeof marker.code === 'string')).toBe(true)
  })

  it('preserves custom codes and details and defaults uncoded custom failures', async () => {
    const schema = createSchema([
      {
        name: 'article',
        type: 'document',
        fields: [
          {
            name: 'coded',
            type: 'string',
            validation: (rule: Rule) =>
              rule.custom(() => ({
                code: 'custom.reserved-title',
                details: {reservedTitle: 'Reserved'},
                message: 'This title is reserved',
              })),
          },
          {
            name: 'uncoded',
            type: 'string',
            validation: (rule: Rule) => rule.custom(() => 'Custom failure'),
          },
          {
            name: 'localized',
            type: 'string',
            validation: (rule: Rule) => rule.custom(() => ({'en-US': 'Localized custom failure'})),
          },
        ],
      },
    ])
    const {client} = createMockClient()

    const markers = await validateMarkers({
      client,
      document: createDocument({
        _type: 'article',
        coded: 'Reserved',
        localized: 'invalid',
        uncoded: 'invalid',
      }),
      schema,
    })

    expect(markers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'custom.reserved-title',
          details: {reservedTitle: 'Reserved'},
          message: 'This title is reserved',
          path: ['coded'],
        }),
        expect.objectContaining({
          code: validationMarkerCodes.custom,
          message: 'Custom failure',
          path: ['uncoded'],
        }),
        expect.objectContaining({
          code: validationMarkerCodes.custom,
          message: 'Localized custom failure',
          path: ['localized'],
        }),
      ]),
    )
  })

  it('adds a fallback code to markers from legacy compiled rules', async () => {
    const message = 'Legacy failure'
    const legacyRule = {
      _fieldRules: undefined,
      _rules: [],
      isRequired: () => false,
      validate: async () => [{item: {message}, level: 'error' as const, message, path: ['title']}],
    } as unknown as Rule
    const schema = createSchema([
      {
        name: 'article',
        type: 'document',
        fields: [{name: 'title', type: 'string', validation: legacyRule}],
      },
    ])
    const {client} = createMockClient()

    await expect(
      validateMarkers({
        client,
        document: createDocument({_type: 'article', title: 'Title'}),
        schema,
      }),
    ).resolves.toEqual([
      expect.objectContaining({code: validationMarkerCodes.validationFailed, message}),
    ])
  })

  it('codes exceptions thrown by custom validators', async () => {
    const schema = createSchema([
      {
        name: 'article',
        type: 'document',
        fields: [
          {
            name: 'title',
            type: 'string',
            validation: (rule: Rule) =>
              rule.custom(() => {
                throw new Error('Custom validator failed')
              }),
          },
        ],
      },
    ])
    const {client} = createMockClient()

    await expect(
      validateMarkers({
        client,
        document: createDocument({_type: 'article', title: 'Title'}),
        schema,
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        code: validationMarkerCodes.validationException,
        message: expect.stringContaining('Custom validator failed'),
        path: ['title'],
      }),
    ])
  })

  it('keeps built-in metadata when a rule overrides the message', async () => {
    const schema = createSchema([
      {
        name: 'article',
        type: 'document',
        fields: [
          {
            name: 'title',
            type: 'string',
            validation: (rule: Rule) => rule.min(10).error('Use a longer title'),
          },
        ],
      },
    ])
    const {client} = createMockClient()

    await expect(
      validateMarkers({
        client,
        document: createDocument({_type: 'article', title: 'Short'}),
        schema,
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        code: validationMarkerCodes.stringMinimumLength,
        details: {actualLength: 5, minimumLength: 10},
        message: 'Use a longer title',
      }),
    ])
  })

  it('returns a coded marker for an unknown document type', async () => {
    const schema = createSchema([])
    const {client} = createMockClient()

    await expect(
      validateMarkers({
        client,
        document: createDocument({_type: 'missing'}),
        schema,
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        code: validationMarkerCodes.documentUnknownType,
        details: {documentType: 'missing'},
        level: 'warning',
      }),
    ])
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
                expect(context).not.toHaveProperty('__internal')
                await context.getClient({apiVersion: '2026-01-01'}).fetch('*[]')
                return true as const
              }),
          },
        ],
      },
    ])
    const {client, fetch} = createMockClient()

    await expect(
      validateMarkers({
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

      await validateMarkers({
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

    const markers = await validateMarkers({
      client,
      document: createDocument({_type: 'article', author: {_ref: 'author-id', _type: 'reference'}}),
      getDocumentExists,
      schema,
    })

    expect(markers).toEqual([
      expect.objectContaining({
        code: validationMarkerCodes.referenceNotPublished,
        details: {referenceId: 'author-id'},
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
      validateMarkers({
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

    await validateDocument({
      client,
      document: createDocument({
        _type: 'article',
        items: Array.from({length: 6}, (_, index) => ({
          _key: String(index),
          _type: 'item',
          value: String(index),
        })),
      }),
      maxCustomValidationConcurrency: 2,
      schema,
    })

    expect(peak).toBe(2)
  })
})
