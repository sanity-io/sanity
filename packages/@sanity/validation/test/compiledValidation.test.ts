import {Schema} from '@sanity/schema'
import {builtinTypes} from '@sanity/schema/_internal'
import {type Rule, type SchemaTypeDefinition} from '@sanity/types'
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
  const validation = vi.fn((rule: Rule) => rule.min(3))
  const schema = createSchema(
    [{name: 'article', type: 'document', fields: [{name: 'name', type: 'string', validation}]}],
    true,
  )
  const callsAfterCompilation = validation.mock.calls.length
  inferFromSchema(schema)
  await validateDocument({schema, document: {...document, name: 'abc'}})
  await validateDocument({schema, document: {...document, name: 'def'}})
  expect(validation).toHaveBeenCalledTimes(callsAfterCompilation)
})
