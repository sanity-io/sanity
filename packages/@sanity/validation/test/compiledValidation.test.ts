import {Schema} from '@sanity/schema'
import {builtinTypes} from '@sanity/schema/_internal'
import {type Rule, type SchemaTypeDefinition, type ValidationContext} from '@sanity/types'
import {describe, expect, it, vi} from 'vitest'

import {validateDocument, validationMarkerCodes} from '../src'
import {inferFromSchema} from '../src/_internal'

const document = {
  _id: 'article-id',
  _type: 'article',
  _rev: 'revision',
  _createdAt: '2026-01-01T00:00:00.000Z',
  _updatedAt: '2026-01-01T00:00:00.000Z',
}

function createSchema(types: SchemaTypeDefinition[], compiled: boolean) {
  const parent = Schema.compile({name: 'builtin', types: builtinTypes})
  if (compiled) inferFromSchema(parent)
  const schema = Schema.compile({name: 'test', parent, types})
  return compiled ? inferFromSchema(schema) : schema
}

describe.each([false, true])('validation with compiled schema=%s', (compiled) => {
  it.each(['date', 'datetime'])('keeps %s validation through multiple aliases', async (type) => {
    const schema = createSchema(
      [
        {name: 'eventDate', type},
        {name: 'nestedDate', type: 'eventDate'},
        {name: 'article', type: 'document', fields: [{name: 'date', type: 'nestedDate'}]},
      ],
      compiled,
    )
    const invalid = await validateDocument({schema, document: {...document, date: 'not a date'}})
    expect(invalid.markers).toEqual([
      expect.objectContaining({code: validationMarkerCodes.dateInvalidFormat}),
    ])
    await expect(
      validateDocument({schema, document: {...document, date: '2027-01-01'}}),
    ).resolves.toMatchObject({status: 'passed', markers: []})
  })

  it('preserves URL scheme overrides across inherited validation arrays', async () => {
    const schema = createSchema(
      [
        {
          name: 'contactUrl',
          type: 'url',
          validation: (rule: Rule) => [rule.uri({scheme: ['mailto']}), rule.required()],
        },
        {name: 'article', type: 'document', fields: [{name: 'contact', type: 'contactUrl'}]},
      ],
      compiled,
    )
    await expect(
      validateDocument({schema, document: {...document, contact: 'mailto:test@example.com'}}),
    ).resolves.toMatchObject({status: 'passed', markers: []})
    const invalid = await validateDocument({
      schema,
      document: {...document, contact: 'https://example.com'},
    })
    expect(invalid.status).toBe('failed')
  })

  it('keeps inherited weak references', async () => {
    const schema = createSchema(
      [
        {name: 'articleReference', type: 'reference', to: [{type: 'article'}], weak: true},
        {
          name: 'article',
          type: 'document',
          fields: [{name: 'related', type: 'articleReference'}],
        },
      ],
      compiled,
    )
    const getDocumentExists = vi.fn(async () => false)
    await expect(
      validateDocument({
        schema,
        getDocumentExists,
        document: {...document, related: {_type: 'reference', _ref: 'missing'}},
      }),
    ).resolves.toMatchObject({status: 'passed', markers: []})
    expect(getDocumentExists).not.toHaveBeenCalled()
  })

  it.each(['image', 'file'])('keeps inherited %s asset requirements', async (type) => {
    const schema = createSchema(
      [
        {name: 'media', type, validation: (rule: Rule) => rule.assetRequired()},
        {name: 'article', type: 'document', fields: [{name: 'media', type: 'media'}]},
      ],
      compiled,
    )
    const result = await validateDocument({
      schema,
      document: {...document, media: {_type: 'media'}},
    })
    expect(result.markers).toEqual([
      expect.objectContaining({
        code: validationMarkerCodes.assetRequired,
        details: {assetType: type},
      }),
    ])
  })

  it('uses the date field’s formatting options for inherited bounds', async () => {
    const schema = createSchema(
      [
        {
          name: 'eventDate',
          type: 'date',
          options: {dateFormat: 'YYYY-MM-DD'},
          validation: (rule: Rule) => rule.min('2026-12-31'),
        },
        {
          name: 'article',
          type: 'document',
          fields: [{name: 'date', type: 'eventDate', options: {dateFormat: 'DD/MM/YYYY'}}],
        },
      ],
      compiled,
    )
    const result = await validateDocument({schema, document: {...document, date: '2026-01-01'}})
    expect(result.markers).toEqual([
      expect.objectContaining({
        code: validationMarkerCodes.dateMinimum,
        message: expect.stringContaining('31/12/2026'),
      }),
    ])
    await expect(
      validateDocument({schema, document: {...document, date: '2027-01-01'}}),
    ).resolves.toMatchObject({status: 'passed', markers: []})
  })

  it('passes child context to Rule.fields builders', async () => {
    const contexts: Array<ValidationContext | undefined> = []
    const schema = createSchema(
      [
        {
          name: 'article',
          type: 'document',
          fields: [
            {name: 'requireValue', type: 'boolean'},
            {
              name: 'details',
              type: 'object',
              fields: [{name: 'title', type: 'string', hidden: true}],
              validation: (rule: Rule) =>
                rule.fields({
                  title: (fieldRule, context) => {
                    contexts.push(context)
                    return context?.document?.requireValue
                      ? fieldRule.required()
                      : fieldRule.optional()
                  },
                }),
            },
          ],
        },
      ],
      compiled,
    )
    const result = await validateDocument({
      schema,
      document: {...document, requireValue: true, details: {}},
    })
    expect(
      result.markers.filter((marker) => marker.code === validationMarkerCodes.valueRequired),
    ).toEqual([expect.objectContaining({path: ['details', 'title']})])
    expect(contexts).toEqual([
      expect.objectContaining({
        document: expect.objectContaining({requireValue: true}),
        parent: {},
        path: ['details', 'title'],
        hidden: true,
        type: expect.objectContaining({name: 'string'}),
      }),
    ])
  })

  it.each([
    [
      'default context',
      (rule: Rule, context: Partial<ValidationContext> = {}) =>
        context.document?.requireValue ? rule.required() : rule.optional(),
    ],
    [
      'default destructured context',
      (rule: Rule, {document: currentDocument}: Partial<ValidationContext> = {}) =>
        currentDocument?.requireValue ? rule.required() : rule.optional(),
    ],
    [
      'rest parameters',
      (...[rule, context]: [Rule, ValidationContext?]) =>
        context?.document?.requireValue ? rule.required() : rule.optional(),
    ],
    [
      'bound function',
      function (this: {enabled: boolean}, rule: Rule, context: Partial<ValidationContext> = {}) {
        return this.enabled && context.document?.requireValue ? rule.required() : rule.optional()
      }.bind({enabled: true}),
    ],
    [
      'wrapped function',
      vi.fn((rule: Rule, context: Partial<ValidationContext> = {}) =>
        context.document?.requireValue ? rule.required() : rule.optional(),
      ),
    ],
  ])('evaluates %s using the current document', async (_name, validation) => {
    const schema = createSchema(
      [
        {name: 'title', type: 'string', validation},
        {
          name: 'article',
          type: 'document',
          fields: [
            {name: 'requireValue', type: 'boolean'},
            {name: 'title', type: 'title'},
          ],
        },
      ],
      compiled,
    )
    for (const requireValue of [false, true, false]) {
      // Run sequentially to exercise changing context against the same compiled schema.
      // oxlint-disable-next-line no-await-in-loop -- each validation checks the next document state
      const result = await validateDocument({schema, document: {...document, requireValue}})
      expect(
        result.markers.filter((marker) => marker.code === validationMarkerCodes.valueRequired),
      ).toHaveLength(requireValue ? 1 : 0)
    }
  })

  it.each(['string', 'color', 'nestedColor'])(
    'uses the field list on %s without requiring an explicit validation function',
    async (type) => {
      const schema = createSchema(
        [
          {name: 'color', type: 'string', options: {list: ['red']}},
          {name: 'nestedColor', type: 'color'},
          {
            name: 'article',
            type: 'document',
            fields: [{name: 'color', type, options: {list: ['blue']}}],
          },
        ],
        compiled,
      )

      await Promise.all(
        ['red', 'green', 'blue'].map(async (color) => {
          const result = await validateDocument({schema, document: {...document, color}})
          expect(result.status).toBe(color === 'blue' ? 'passed' : 'failed')
        }),
      )
    },
  )

  it('removes an inherited list when field options replace it', async () => {
    const schema = createSchema(
      [
        {name: 'color', type: 'string', options: {list: ['red']}},
        {name: 'nestedColor', type: 'color'},
        {
          name: 'article',
          type: 'document',
          fields: [{name: 'color', type: 'nestedColor', options: {}}],
        },
      ],
      compiled,
    )
    await expect(
      validateDocument({schema, document: {...document, color: 'green'}}),
    ).resolves.toMatchObject({status: 'passed', markers: []})
  })

  it('keeps inherited explicit validation when rebuilding the field list', async () => {
    const schema = createSchema(
      [
        {
          name: 'color',
          type: 'string',
          options: {list: ['red']},
          validation: (rule: Rule) => [rule.required(), rule.min(3)],
        },
        {
          name: 'article',
          type: 'document',
          fields: [{name: 'color', type: 'color', options: {list: ['blue', 'a']}}],
        },
      ],
      compiled,
    )

    const missing = await validateDocument({schema, document})
    expect(missing.markers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({code: validationMarkerCodes.valueRequired}),
      ]),
    )
    const short = await validateDocument({schema, document: {...document, color: 'a'}})
    expect(short.status).toBe('failed')
    await expect(
      validateDocument({schema, document: {...document, color: 'blue'}}),
    ).resolves.toMatchObject({status: 'passed', markers: []})
  })

  it('allows a field validation function to replace inherited validation', async () => {
    const schema = createSchema(
      [
        {name: 'name', type: 'string', validation: (rule: Rule) => rule.min(5)},
        {
          name: 'article',
          type: 'document',
          fields: [{name: 'name', type: 'name', validation: (rule: Rule) => rule.min(2)}],
        },
      ],
      compiled,
    )
    await expect(
      validateDocument({schema, document: {...document, name: 'abc'}}),
    ).resolves.toMatchObject({status: 'passed', markers: []})
  })

  it('preserves explicit valid constraints alongside inferred list constraints', async () => {
    const schema = createSchema(
      [
        {
          name: 'color',
          type: 'string',
          options: {list: ['red']},
          validation: (rule: Rule) => rule.valid(['red', 'blue']),
        },
        {
          name: 'article',
          type: 'document',
          fields: [{name: 'color', type: 'color', options: {list: ['blue', 'green']}}],
        },
      ],
      compiled,
    )
    await Promise.all(
      ['red', 'green', 'blue'].map(async (color) => {
        const result = await validateDocument({schema, document: {...document, color}})
        expect(result.status).toBe(color === 'blue' ? 'passed' : 'failed')
      }),
    )
  })
})

it('reuses compiled static rules for the same field across repeated inference and validation', async () => {
  const onCompile = vi.fn()
  const validation = (rule: Rule) => {
    onCompile()
    return rule.min(3)
  }
  const schema = createSchema(
    [{name: 'article', type: 'document', fields: [{name: 'name', type: 'string', validation}]}],
    true,
  )
  const callsAfterCompilation = onCompile.mock.calls.length
  expect(callsAfterCompilation).toBeGreaterThan(0)
  inferFromSchema(schema)
  await validateDocument({schema, document: {...document, name: 'abc'}})
  await validateDocument({schema, document: {...document, name: 'def'}})
  expect(onCompile).toHaveBeenCalledTimes(callsAfterCompilation)
})
