import {type SanityClient} from '@sanity/client'
import {Schema as SchemaBuilder} from '@sanity/schema'
import {type ObjectSchemaType, type Rule, type SanityDocument} from '@sanity/types'
import {afterEach, describe, expect, test, vi} from 'vitest'

import {type Workspace} from '../../src/core/config'
import {getFallbackLocaleSource} from '../../src/core/i18n/fallback'
import {createSchema} from '../../src/core/schema/createSchema'
import {inferFromSchema} from '../../src/core/validation/inferFromSchema'
import {validateDocument} from '../../src/core/validation/validateDocument'
import {createMockSanityClient} from './mocks/mockSanityClient'

const client = createMockSanityClient()
const getClient = (): SanityClient => client as unknown as SanityClient

describe('schema validation inference', () => {
  describe('object with `options.list` and `value` field', () => {
    const listOptions = [
      {value: '#f00', title: 'Red'},
      {value: '#0f0', title: 'Green'},
      {value: '#00f', title: 'Blue'},
    ]

    const schema = SchemaBuilder.compile({
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
      const type = inferFromSchema(schema).get('colorList')!
      await expectNoError(type.validation as Rule[], listOptions[0])
    })

    test('disallowed value', async () => {
      const type = inferFromSchema(schema).get('colorList')!

      await expectError(
        type.validation as Rule[],
        {value: '#ccc', title: 'Gray'},
        'Value did not match any allowed value',
      )
    })
  })

  describe('field validations', () => {
    const fieldValidationInferReproDoc = {
      name: 'fieldValidationInferReproDoc',
      type: 'document',
      title: 'FieldValidationRepro',
      // eslint-disable-next-line @typescript-eslint/no-shadow
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

    const schema = SchemaBuilder.compile({
      types: [fieldValidationInferReproDoc],
    })

    test('field validations defined on an object type does not affect the field type validation', () => {
      const documentType = inferFromSchema(schema).get(
        'fieldValidationInferReproDoc',
      ) as ObjectSchemaType
      const fieldWithoutValidation = documentType.fields.find(
        (field) => field.name === 'stringField',
      )

      // The first field should only have the validation rules that comes with its type
      expect(
        (fieldWithoutValidation?.type.validation as Rule[]).flatMap(
          // eslint-disable-next-line dot-notation
          (validation) => validation['_rules'],
        ),
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
      name: 'default',
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
      client.fetch.mockReset()
    })

    test('slug is valid if uniqueness queries returns true', async () => {
      client.fetch.mockImplementation(() =>
        Promise.resolve(
          // return true to mock a unique result (valid)
          true,
        ),
      )

      await expect(
        validateDocument({
          document: mockDocument,
          getClient,
          getDocumentExists: () => Promise.resolve(true),
          workspace: {schema} as Workspace,
        }),
      ).resolves.toEqual([])

      expect(client.fetch).toHaveBeenCalledTimes(1)
      expect(client.fetch.mock.calls[0]).toEqual([
        '!defined(*[_type == $docType && !(_id == $published || _id == $draft || _id in path("versions.**.mockDocument")) && slugField.current == $slug][0]._id)',
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
      client.fetch.mockReset()
      client.fetch.mockImplementation(() =>
        Promise.resolve(
          // return false to mock a non-unique result (invalid)
          false,
        ),
      )

      await expect(
        validateDocument({
          document: mockDocument,
          getClient,
          getDocumentExists: () => Promise.resolve(true),
          workspace: {schema} as Workspace,
        }),
      ).resolves.toMatchObject([
        {
          path: ['slugField'],
          level: 'error',
          message: 'Slug is already in use',
        },
      ])

      expect(client.fetch).toHaveBeenCalledTimes(1)
      expect(client.fetch.mock.calls[0]).toEqual([
        '!defined(*[_type == $docType && !(_id == $published || _id == $draft || _id in path("versions.**.mockDocument")) && slugField.current == $slug][0]._id)',
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

  describe('reference validation', () => {
    const documentWithReference = {
      type: 'document',
      name: 'documentWithReference',
      title: 'Document with Reference',
      fields: [
        {
          name: 'referenceField',
          type: 'reference',
          to: [{type: 'documentWithReference'}],
        },
        {
          name: 'referenceFieldWeak',
          type: 'reference',
          weak: true,
          to: [{type: 'documentWithReference'}],
        },
      ],
    }

    const schema = createSchema({
      name: 'default',
      types: [documentWithReference],
    })

    const mockDocument: SanityDocument = {
      _id: 'mockDocument',
      _type: 'documentWithReference',
      _createdAt: '2021-08-26T18:47:55.497Z',
      _updatedAt: '2021-08-26T18:47:55.497Z',
      _rev: 'example-rev',
    }

    afterEach(() => {
      client.fetch.mockReset()
    })

    test('reference is invalid if no _ref is present', async () => {
      await expect(
        validateDocument({
          document: {
            ...mockDocument,
            referenceField: {
              _type: 'not-a-reference',
            },
          },
          getClient,
          workspace: {schema} as Workspace,
        }),
      ).resolves.toMatchObject([
        {
          message: 'Must be a reference to a document',
          level: 'error',
          path: ['referenceField'],
        },
      ])
    })

    test('referenced document must exist (unless weak)', async () => {
      const mockGetDocumentExists = vi.fn(() => Promise.resolve(false))
      await expect(
        validateDocument({
          document: {
            ...mockDocument,
            referenceField: {
              _ref: 'example-id',
            },
          },
          getClient,
          workspace: {schema} as Workspace,
          getDocumentExists: mockGetDocumentExists,
        }),
      ).resolves.toMatchObject([
        {
          message: /.+/,
          level: 'error',
          path: ['referenceField'],
        },
      ])

      expect(mockGetDocumentExists.mock.calls).toMatchObject([[{id: 'example-id'}]])
    })

    test('reference is valid if schema type is marked as weak', async () => {
      await expect(
        validateDocument({
          getClient,
          document: {
            ...mockDocument,
            referenceFieldWeak: {_ref: 'example-id'},
          },
          workspace: {schema} as Workspace,
        }),
      ).resolves.toEqual([])
    })

    test('reference is valid if schema type is strong and document does exists', async () => {
      const mockGetDocumentExists = vi.fn(() => Promise.resolve(true))
      await expect(
        validateDocument({
          getClient,
          document: {
            ...mockDocument,
            referenceField: {
              _ref: 'example-id',
            },
          },
          workspace: {schema} as Workspace,
          getDocumentExists: mockGetDocumentExists,
        }),
      ).resolves.toEqual([])

      expect(mockGetDocumentExists.mock.calls).toMatchObject([[{id: 'example-id'}]])
    })
  })
})

async function expectNoError(validations: Rule[], value: unknown) {
  const errors = (
    await Promise.all(
      validations.map((rule) =>
        rule.validate(value, {
          getClient,
          schema: {} as any,
          i18n: getFallbackLocaleSource(),
          environment: 'studio',
        }),
      ),
    )
  ).flat()
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
  level = 'error',
) {
  const errors = (
    await Promise.all(
      validations.map((rule) =>
        rule.validate(value, {
          getClient,
          schema: {} as any,
          i18n: getFallbackLocaleSource(),
          environment: 'studio',
        }),
      ),
    )
  ).flat()
  if (!errors.length) {
    throw new Error(`Expected error matching "${message}", but no errors were returned.`)
  }

  const matches = errors.filter((err) => err.item && err.item.message.includes(message!))
  if (matches.length === 0) {
    const messages = errors.map((err) => err.item && err.item.message).join('\n\n- ')
    throw new Error(`Expected error matching "${message}" not found. Errors found:\n- ${messages}`)
  }

  const levelMatch = matches.find((err) => err.level === level)
  if (!levelMatch) {
    throw new Error(`Expected error to have level "${level}", got ${matches[0].level}`)
  }

  // This shouldn't actually be needed, but counts against an assertion in jest-terms
  expect(levelMatch.message).toMatch(message!)
}
