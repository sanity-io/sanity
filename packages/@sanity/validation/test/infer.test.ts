/// <reference types="@sanity/types/parts" />

import Schema from '@sanity/schema'
import {ObjectSchemaType, Rule, SanityDocument} from '@sanity/types'
import createSchema from 'part:@sanity/base/schema-creator'
import client from 'part:@sanity/base/client'
import inferFromSchema from '../src/inferFromSchema'
import validateDocument from '../src/validateDocument'

jest.mock('part:@sanity/base/client', () => {
  const mockClient = {
    fetch: jest.fn(),
    withConfig: jest.fn(() => mockClient),
  }
  return mockClient
})

describe('schema validation inference', () => {
  describe('object with `options.list` and `value` field', () => {
    const listOptions = [
      {value: '#f00', title: 'Red'},
      {value: '#0f0', title: 'Green'},
      {value: '#00f', title: 'Blue'},
    ]

    const schema = Schema.compile({
      types: [
        {
          name: 'colorList',
          type: 'object',
          fields: [
            {name: 'value', type: 'string'},
            {name: 'title', type: 'string'},
          ],
          options: {
            list: listOptions,
          },
        },
      ],
    })

    test('allowed value', async () => {
      const type = inferFromSchema(schema).get('colorList')
      await expectNoError(type.validation as Rule[], listOptions[0])
    })

    test('disallowed value', async () => {
      const type = inferFromSchema(schema).get('colorList')
      await expectError(
        type.validation as Rule[],
        {value: '#ccc', title: 'Gray'},
        'Value did not match any allowed value'
      )
    })
  })
  describe('field validations', () => {
    const fieldValidationInferReproDoc = {
      name: 'fieldValidationInferReproDoc',
      type: 'document',
      title: 'FieldValidationRepro',
      // eslint-disable-next-line no-shadow
      validation: (Rule: Rule) =>
        Rule.fields({
          stringField: (fieldRule) => fieldRule.required(),
        }),

      fields: [
        {
          name: 'stringField',
          type: 'string',
          title: 'Field of someObjectType with validation',
          description: 'First field should be required',
        },
      ],
    }

    const schema = Schema.compile({
      types: [fieldValidationInferReproDoc],
    })

    test('field validations defined on an object type does not affect the field type validation', () => {
      const documentType = inferFromSchema(schema).get(
        'fieldValidationInferReproDoc'
      ) as ObjectSchemaType
      const fieldWithoutValidation = documentType.fields.find(
        (field) => field.name === 'stringField'
      )

      // The first field should only have the validation rules that comes with its type
      expect(
        (fieldWithoutValidation?.type.validation as Rule[]).flatMap(
          // eslint-disable-next-line dot-notation
          (validation) => validation['_rules']
        )
      ).toEqual([{flag: 'type', constraint: 'String'}])
    })
  })
  describe('slug validation', () => {
    const slugField = {
      type: 'document',
      name: 'documentWithSlug',
      title: 'Document with Slug',
      fields: [
        {
          name: 'slugField',
          type: 'slug',
        },
      ],
    }

    const schema = createSchema({
      types: [slugField],
    })

    const mockDocument: SanityDocument = {
      _id: 'mockDocument',
      _type: 'documentWithSlug',
      slugField: {current: 'example-value'},
      _createdAt: '2021-08-26T18:47:55.497Z',
      _updatedAt: '2021-08-26T18:47:55.497Z',
      _rev: 'example-rev',
    }

    afterEach(() => {
      ;(client.fetch as jest.Mock).mockReset()
    })

    test('slug is valid if uniqueness queries returns true', async () => {
      ;(client.fetch as jest.Mock).mockImplementation(() =>
        Promise.resolve(
          // return true to mock a unique result (valid)
          true
        )
      )
      await expect(validateDocument(mockDocument, schema)).resolves.toEqual([])

      expect(client.fetch).toHaveBeenCalledTimes(1)
      expect((client.fetch as jest.Mock).mock.calls[0]).toEqual([
        '!defined(*[_type == $docType && !(_id in [$draft, $published]) && slugField.current == $slug][0]._id)',
        {
          docType: 'documentWithSlug',
          draft: 'drafts.mockDocument',
          published: 'mockDocument',
          slug: 'example-value',
        },
        {
          tag: 'validation.slug-is-unique',
        },
      ])
    })

    test('slug is invalid if uniqueness queries returns false', async () => {
      ;(client.fetch as jest.Mock).mockReset()
      ;(client.fetch as jest.Mock).mockImplementation(() =>
        Promise.resolve(
          // return false to mock a non-unique result (invalid)
          false
        )
      )

      await expect(validateDocument(mockDocument, schema)).resolves.toMatchObject([
        {
          type: 'validation',
          path: ['slugField'],
          level: 'error',
          item: {message: 'Slug is already in use', paths: []},
        },
      ])

      expect(client.fetch).toHaveBeenCalledTimes(1)
      expect((client.fetch as jest.Mock).mock.calls[0]).toEqual([
        '!defined(*[_type == $docType && !(_id in [$draft, $published]) && slugField.current == $slug][0]._id)',
        {
          docType: 'documentWithSlug',
          draft: 'drafts.mockDocument',
          published: 'mockDocument',
          slug: 'example-value',
        },
        {
          tag: 'validation.slug-is-unique',
        },
      ])
    })
  })
})

async function expectNoError(validations: Rule[], value: unknown) {
  const errors = (await Promise.all(validations.map((rule) => rule.validate(value)))).flat()
  if (errors.length === 0) {
    // This shouldn't actually be needed, but counts against an assertion in jest-terms
    expect(errors).toHaveLength(0)
    return
  }

  const messages = errors.map((err) => err.item && err.item.message).join('\n\n- ')
  throw new Error(`Expected no errors, but found ${errors.length}:\n- ${messages}`)
}

async function expectError(
  validations: Rule[],
  value: unknown,
  message: string | undefined,
  level = 'error'
) {
  const errors = (await Promise.all(validations.map((rule) => rule.validate(value)))).flat()
  if (!errors.length) {
    throw new Error(`Expected error matching "${message}", but no errors were returned.`)
  }

  const matches = errors.filter((err) => err.item && err.item.message.includes(message))
  if (matches.length === 0) {
    const messages = errors.map((err) => err.item && err.item.message).join('\n\n- ')
    throw new Error(`Expected error matching "${message}" not found. Errors found:\n- ${messages}`)
  }

  const levelMatch = matches.find((err) => err.level === level)
  if (!levelMatch) {
    throw new Error(`Expected error to have level "${level}", got ${matches[0].level}`)
  }

  // This shouldn't actually be needed, but counts against an assertion in jest-terms
  expect(levelMatch.item.message).toMatch(message)
}
