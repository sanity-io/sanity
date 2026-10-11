import {Schema} from '@sanity/schema'
import {builtinTypes} from '@sanity/schema/_internal'
import {type SchemaTypeDefinition} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {validateDocument, validationMarkerCodes} from '../src'
import {inferFromSchema} from '../src/_internal'

const document = {
  _id: 'article-id',
  _type: 'article',
  _rev: 'revision',
  _createdAt: '2026-01-01T00:00:00.000Z',
  _updatedAt: '2026-01-01T00:00:00.000Z',
}

describe.each([false, true])('list validation with compiled schema=%s', (compiled) => {
  function createSchema(types: SchemaTypeDefinition[]) {
    const parent = Schema.compile({name: 'builtin', types: builtinTypes})
    if (compiled) inferFromSchema(parent)
    const schema = Schema.compile({name: 'test', parent, types})
    return compiled ? inferFromSchema(schema) : schema
  }

  it.each([
    {_type: 'tag', label: 'Popular', value: 'popular'},
    {_type: 'tag', label: 'Popular'},
    {_type: 'tag', label: 'Popular', value: 'popular', _key: 'option-key'},
  ])('validates the whole object option %j', async (option) => {
    const schema = createSchema([
      {
        name: 'article',
        type: 'document',
        fields: [
          {
            name: 'faqTags',
            type: 'array',
            of: [
              {
                type: 'object',
                name: 'tag',
                fields: [
                  {name: 'label', type: 'string'},
                  {name: 'value', type: 'string'},
                ],
              },
            ],
            options: {list: [option]},
          },
        ],
      },
    ])

    for (const faqTags of [undefined, [], [{...option, _key: 'auto-generated-0'}]]) {
      await expect(
        validateDocument({schema, document: {...document, faqTags}}),
      ).resolves.toMatchObject({status: 'passed', markers: []})
    }

    for (const invalid of [
      {...option, label: 'Changed'},
      {...option, value: 'unlisted'},
      {_type: 'tag', value: option.value},
    ]) {
      const result = await validateDocument({
        schema,
        document: {...document, faqTags: [{...invalid, _key: 'selected-key'}]},
      })
      expect(result.status).toBe('failed')
      expect(result.markers).toEqual([
        expect.objectContaining({
          code: validationMarkerCodes.valueNotAllowed,
          path: ['faqTags', {_key: 'selected-key'}],
        }),
      ])
    }
  })

  it('uses overridden object options on an inherited array type', async () => {
    const popular = {_type: 'tag', label: 'Popular', value: 'popular'}
    const featured = {_type: 'tag', label: 'Featured', value: 'featured'}
    const schema = createSchema([
      {
        name: 'tag',
        type: 'object',
        fields: [
          {name: 'label', type: 'string'},
          {name: 'value', type: 'string'},
        ],
      },
      {name: 'tags', type: 'array', of: [{type: 'tag'}], options: {list: [popular]}},
      {name: 'faqTags', type: 'tags'},
      {
        name: 'article',
        type: 'document',
        fields: [{name: 'faqTags', type: 'faqTags', options: {list: [featured]}}],
      },
    ])

    await expect(
      validateDocument({
        schema,
        document: {...document, faqTags: [{...featured, _key: 'selected-key'}]},
      }),
    ).resolves.toMatchObject({status: 'passed', markers: []})
    const invalid = await validateDocument({
      schema,
      document: {...document, faqTags: [{...popular, _key: 'selected-key'}]},
    })
    expect(invalid.markers).toEqual([
      expect.objectContaining({code: validationMarkerCodes.valueNotAllowed}),
    ])
  })

  it.each([
    {type: 'string', allowed: 'popular', disallowed: 'unlisted'},
    {type: 'number', allowed: 1, disallowed: 2},
  ])('keeps title/value options working for $type arrays', async ({type, allowed, disallowed}) => {
    const schema = createSchema([
      {
        name: 'article',
        type: 'document',
        fields: [
          {
            name: 'choices',
            type: 'array',
            of: [{type}],
            options: {list: [{title: 'Allowed', value: allowed}]},
          },
        ],
      },
    ])

    await expect(
      validateDocument({schema, document: {...document, choices: [allowed]}}),
    ).resolves.toMatchObject({status: 'passed', markers: []})
    const invalid = await validateDocument({schema, document: {...document, choices: [disallowed]}})
    expect(invalid.markers).toEqual([
      expect.objectContaining({code: validationMarkerCodes.valueNotAllowed, path: ['choices', 0]}),
    ])
  })
})
