import {
  type ArraySchemaType,
  type PortableTextTextBlock,
  type Rule,
  type SanityDocument,
  type Schema,
  type SchemaType,
  type SchemaTypeDefinition,
  type ValidationContext,
} from '@sanity/types'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createSchema, type Workspace} from '../../src/core'
import {getFallbackLocaleSource} from '../../src/core/i18n/fallback'
import {convertToValidationMarker} from '../../src/core/validation/util/convertToValidationMarker'
import {
  resolveTypeForArrayItem,
  validateDocument,
  validateItem,
} from '../../src/core/validation/validateDocument'
import {createMockSanityClient} from './mocks/mockSanityClient'

type ConvertToValidationMarker =
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  typeof import('../../src/core/validation/util/convertToValidationMarker')

vi.mock('../../src/core/validation/util/convertToValidationMarker', async () => {
  return {
    convertToValidationMarker: vi.fn(
      (
        await vi.importActual<ConvertToValidationMarker>(
          '../../src/core/validation/util/convertToValidationMarker',
        )
      ).convertToValidationMarker,
    ),
  }
})

beforeEach(() => {
  convertToValidationMarker.mockClear()
})

// mock client
const client = createMockSanityClient() as any as ReturnType<ValidationContext['getClient']>
const getClient = (options: {apiVersion: string}) => client

describe('resolveTypeForArrayItem', () => {
  const schema: Schema = createSchema({
    name: 'default',
    types: [
      {
        name: 'foo',
        type: 'object',
        fields: [{name: 'title', type: 'number'}],
      },
      {
        name: 'bar',
        type: 'object',
        fields: [{name: 'title', type: 'string'}],
      },
    ],
  })

  const fooType = schema.get('foo')
  const barType = schema.get('bar')

  it('finds a matching schema type for an array item value given a list of candidate types', () => {
    const resolved = resolveTypeForArrayItem(
      {
        _type: 'bar',
        _key: 'exampleKey',
        title: 5,
      },
      [fooType!, barType!],
    )

    expect(resolved).toBe(barType)
  })

  it('assumes the type if there is only one possible candidate', () => {
    const resolved = resolveTypeForArrayItem(
      {
        // notice no _type
        _key: 'exampleKey',
        title: 5,
      },
      [fooType!],
    )

    expect(resolved).toBe(fooType)
  })
})

describe('validateDocument', () => {
  it('takes in a document + a compiled schema and returns a list of validation markers', async () => {
    const schema = createSchema({
      name: 'default',
      types: [
        {
          name: 'simpleDoc',
          type: 'document',
          title: 'Simple Document',
          fields: [
            {
              name: 'title',
              type: 'string',
              validation: (rule: Rule) => rule.required(),
            },
          ],
        },
      ],
    })

    const document: SanityDocument = {
      _id: 'testId',
      _createdAt: '2021-08-27T14:48:51.650Z',
      _rev: 'exampleRev',
      _type: 'simpleDoc',
      _updatedAt: '2021-08-27T14:48:51.650Z',
      title: null,
    }

    const result = await validateDocument({
      getClient,
      document,
      workspace: {schema} as Workspace,
    })

    expect(result).toMatchObject([
      {
        level: 'error',
        message: 'Expected type "String", got "null"',
        path: ['title'],
      },
      {
        level: 'error',
        message: 'Required',
        path: ['title'],
      },
    ])
  })
})

describe('validateItem', () => {
  it("runs nested validation on an undefined value for object types if it's required", async () => {
    const validation = (rule: Rule) => [
      rule.required().error('This is required!'),
      rule.max(160).warning('Too long!'),
    ]

    const schema = createSchema({
      name: 'default',
      types: [
        {
          name: 'testObj',
          type: 'object',
          title: 'Test Object',
          fields: [
            {name: 'registeredString', type: 'registeredString'},
            {name: 'inlineString', type: 'string', validation},
            {
              name: 'registeredObject',
              type: 'registeredObjectField',
              validation: (rule: Rule) => rule.required(),
            },
            {
              name: 'inlineObject',
              type: 'object',
              fields: [{name: 'foo', type: 'string', validation}],
              validation: (rule: Rule) => rule.required(),
            },
            {
              name: 'notRequiredRegisteredObject',
              type: 'registeredObjectField',
            },
            {
              name: 'notRequiredInlineObject',
              type: 'object',
              fields: [{name: 'foo', type: 'string', validation}],
            },
          ],
        },
        {name: 'registeredString', title: 'Registered String', type: 'string', validation},
        {
          title: 'Registered Object Field',
          name: 'registeredObjectField',
          type: 'object',
          fields: [{name: 'foo', type: 'string', validation}],
        },
      ],
    })
    // ensures there are no schema formatting issues
    expect(schema._validation).toHaveLength(0)

    await expect(
      validateItem({
        getClient,
        schema,
        value: {},
        document: undefined,
        path: [],
        parent: undefined,
        type: schema.get('testObj'),
        getDocumentExists: undefined,
        i18n: getFallbackLocaleSource(),
        environment: 'studio',
      }),
    ).resolves.toMatchObject([
      {
        level: 'error',
        item: {message: 'This is required!'},
        path: ['registeredString'],
      },
      {
        level: 'error',
        item: {message: 'This is required!'},
        path: ['inlineString'],
      },
      {
        level: 'error',
        item: {message: 'Required'},
        path: ['registeredObject'],
      },
      {
        level: 'error',
        item: {message: 'This is required!'},
        path: ['registeredObject', 'foo'],
      },
      {
        level: 'error',
        item: {message: 'Required'},
        path: ['inlineObject'],
      },
      {
        level: 'error',
        item: {message: 'This is required!'},
        path: ['inlineObject', 'foo'],
      },
    ])
  })

  it('runs nested validation for object-level rules set via Rule.fields()', async () => {
    const schema = createSchema({
      name: 'default',
      types: [
        {
          name: 'testObj',
          type: 'object',
          title: 'Test Object',
          fields: [
            {name: 'foo', type: 'string'},
            {name: 'bar', type: 'string'},
          ],
          validation: (rule: Rule) => [
            rule.required(),
            rule.fields({
              foo: (r) => r.required(),
              bar: (r) => r.required(),
            }),
          ],
        },
      ],
    })

    // ensures there are no schema formatting issues
    expect(schema._validation).toHaveLength(0)

    await expect(
      validateItem({
        getClient,
        schema,
        document: undefined,
        parent: undefined,
        path: undefined,
        type: schema.get('testObj'),
        value: {foo: 5},
        getDocumentExists: undefined,
        i18n: getFallbackLocaleSource(),
        environment: 'studio',
      }),
    ).resolves.toMatchObject([
      {
        item: {message: 'Expected type "String", got "Number"'},
        level: 'error',
        path: ['foo'],
      },
      {
        item: {message: 'Required'},
        level: 'error',
        path: ['bar'],
      },
    ])
  })

  // @todo this one fails, needs investigation for what is actually the expected outcome
  it.skip('runs nested validation for markDefs', async () => {
    const linkValidationSpy = vi.fn(() => true as const)
    const internalLinkSpy = vi.fn(() => 'mock invalid response')

    const schema = createSchema({
      name: 'default',
      types: [
        {
          name: 'post',
          title: 'Post',
          type: 'document',
          fields: [
            {name: 'title', type: 'string'},
            {name: 'body', type: 'string'},
          ],
        },
        {
          name: 'registeredEditor',
          type: 'object',
          title: 'Registered Editor',
          fields: [
            {
              name: 'editor',
              type: 'array',
              of: [
                {
                  type: 'block',
                  marks: {
                    annotations: [
                      {
                        name: 'exampleAnnotation',
                        type: 'object',
                        fields: [{name: 'value', type: 'string'}],
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
        {
          name: 'blockTest',
          type: 'document',
          title: 'blockTest',
          fields: [
            {
              name: 'content',
              title: 'Content',
              type: 'array',
              of: [
                {
                  type: 'block',
                  marks: {
                    annotations: [
                      {
                        name: 'link',
                        type: 'object',
                        title: 'link',
                        fields: [{name: 'url', type: 'url'}],
                        validation: (rule: Rule) => rule.custom(linkValidationSpy),
                      },
                      {
                        name: 'internalLink',
                        type: 'object',
                        title: 'Internal link',
                        fields: [{name: 'reference', type: 'reference', to: [{type: 'post'}]}],
                        validation: (rule: Rule) => rule.custom(internalLinkSpy),
                      },
                      {name: 'nestedEditor', type: 'registeredEditor'},
                    ],
                  },
                },
              ],
            },
          ],
        },
      ],
    })

    expect(schema._validation).toHaveLength(0)

    const nestedBlock: PortableTextTextBlock = {
      _type: 'block',
      _key: 'nested-block-key',
      children: [
        {
          _key: 'some-key',
          _type: 'span',
          text: 'hey',
          marks: ['example-annotation-key'],
        },
      ],
      markDefs: [
        {
          _type: 'exampleAnnotation',
          _key: 'example-annotation-key',
          value: 5,
        },
      ],
      style: 'normal',
    }

    const block: PortableTextTextBlock = {
      _key: 'block-key',
      _type: 'block',
      children: [
        {
          _key: 'child-0',
          _type: 'span',
          marks: ['0', '1', '2'],
          text: 'hey',
        },
      ],
      markDefs: [
        {
          _key: '0',
          _type: 'link',
          url: 'https://example.com',
        },
        {
          _key: '1',
          _type: 'internalLink',
          _ref: 'post-id',
        },
        {
          _key: '2',
          _type: 'nestedEditor',
          editor: [nestedBlock],
        },
      ],
      style: 'normal',
    }

    const document: SanityDocument = {
      _id: 'mock-id',
      _type: 'blockTest',
      _createdAt: '2021-11-15T21:06:41.812Z',
      _rev: 'example-ref',
      _updatedAt: '2021-11-15T21:06:41.812Z',
      content: [block],
    }

    const result = await validateItem({
      getClient,
      schema,
      document: document,
      parent: undefined,
      path: [],
      type: schema.get('blockTest'),
      value: document,
      getDocumentExists: undefined,
      i18n: getFallbackLocaleSource(),
      environment: 'studio',
    })

    expect(result).toMatchObject([
      {
        item: {message: 'mock invalid response', paths: []},
        level: 'error',
        path: ['content', {_key: 'block-key'}, 'markDefs', {_key: '1'}],
      },
      // this tests for nested markDef validation
      {
        item: {
          message: 'Expected type "String", got "Number"',
          paths: [],
        },
        level: 'error',
        path: [
          'content',
          {_key: 'block-key'},
          'markDefs',
          {_key: '2'},
          'editor',
          {_key: 'nested-block-key'},
          'markDefs',
          {_key: 'example-annotation-key'},
          'value',
        ],
      },
    ])

    expect(linkValidationSpy.mock.calls).toMatchObject([
      [
        {
          _key: '0',
          _type: 'link',
          url: 'https://example.com',
        },
        {
          document: {_id: 'mock-id'},
          parent: {_key: 'block-key'},
          path: ['content', {_key: 'block-key'}, 'markDefs', {_key: '0'}],
          type: {name: 'link'},
        },
      ],
    ])

    expect(internalLinkSpy.mock.calls).toMatchObject([
      [
        {
          _key: '1',
          _ref: 'post-id',
          _type: 'internalLink',
        },
        {
          document: {_id: 'mock-id'},
          parent: {_key: 'block-key'},
          path: ['content', {_key: 'block-key'}, 'markDefs', {_key: '1'}],
          type: {name: 'internalLink'},
        },
      ],
    ])
  })

  it('resolves an array item type if there is just one type', async () => {
    const schema = createSchema({
      name: 'default',
      types: [
        {
          name: 'values',
          title: 'Values',
          type: 'array',
          // note that there is only one type available
          of: [{type: 'arrayItem'}],
          validation: (rule: Rule) => rule.required(),
        },
        {
          title: 'Array Item',
          name: 'arrayItem',
          type: 'object',
          fields: [{name: 'title', type: 'string'}],
        },
      ],
    })

    // ensures there are no schema formatting issues
    expect(schema._validation).toHaveLength(0)

    const values = [
      {
        // note how this doesn't have a _type
        title: 5,
        _key: 'exampleKey',
      },
    ]

    await expect(
      validateItem({
        getClient,
        schema,
        document: undefined,
        parent: undefined,
        path: [],
        type: schema.get('values'),
        value: values,
        getDocumentExists: undefined,
        i18n: getFallbackLocaleSource(),
        environment: 'studio',
      }),
    ).resolves.toMatchObject([
      {
        level: 'error',
        message: 'Expected type "String", got "Number"',
        path: [{_key: 'exampleKey'}, 'title'],
      },
    ])
  })

  it('properly passes the nested value, type, and path to rule.validate', async () => {
    const schema: Schema = createSchema({
      name: 'default',
      types: [
        {
          name: 'root',
          type: 'object',
          title: 'Root',
          fields: [
            {
              name: 'level1Object',
              type: 'object',
              validation: (rule: Rule) => rule.custom(() => 'from level 1 object'),
              fields: [
                {
                  name: 'level2String',
                  type: 'string',
                  validation: (rule: Rule) => rule.custom(() => 'from level 2 via object'),
                },
              ],
            },
            {
              name: 'level1Array',
              type: 'array',
              validation: (rule: Rule) => rule.custom(() => 'from level 1 array'),
              of: [
                {
                  type: 'object',
                  fields: [
                    {
                      name: 'level2Number',
                      type: 'number',
                      validation: (rule: Rule) => rule.custom(() => 'from level 2 via array'),
                    },
                  ],
                },
              ],
            },
          ],
          validation: (rule: Rule) => rule.custom(() => 'from root'),
        },
      ],
    })

    // ensures there are no schema formatting issues
    // oxlint-disable-next-line no-explicit-any
    expect((schema as any)._validation).toHaveLength(0)

    const value = {
      level1Object: {level3String: 'a string'},
      level1Array: [{level2Number: 5}],
    }

    const document: SanityDocument = {
      value,
      _type: 'something',
      _createdAt: '2021-09-05T19:28:30.882Z',
      _id: 'something.id',
      _rev: 'exampleRev',
      _updatedAt: '2021-09-05T19:28:30.882Z',
    }

    const getField = ({in: type, name}: {in: SchemaType; name: string}) => {
      const result = 'fields' in type && type.fields.find((f) => f.name === name)?.type
      if (!result) throw new Error(`Could not find field \`${name}\` in \`${type.name}\``)
      return result
    }

    const rootType = schema.get('root')
    const level1ObjectType = getField({in: rootType!, name: 'level1Object'})
    const level2StringType = getField({in: level1ObjectType, name: 'level2String'})
    const level1ArrayType = getField({in: rootType!, name: 'level1Array'})
    const level2NumberType = getField({
      in: (level1ArrayType as ArraySchemaType).of[0],
      name: 'level2Number',
    })

    await expect(
      validateItem({
        getClient,
        schema,
        value,
        type: rootType,
        document,
        parent: document,
        path: undefined,
        getDocumentExists: undefined,
        i18n: getFallbackLocaleSource(),
        environment: 'studio',
      }),
    ).resolves.toMatchObject([
      {
        item: {message: 'from root'},
        path: [],
      },
      {
        item: {message: 'from level 1 object'},
        path: ['level1Object'],
      },
      {
        item: {message: 'from level 2 via object'},
        path: ['level1Object', 'level2String'],
      },
      {
        item: {message: 'from level 1 array'},
        path: ['level1Array'],
      },
      {
        item: {message: 'from level 2 via array'},
        path: ['level1Array', 0, 'level2Number'],
      },
    ])

    const calls = convertToValidationMarker.mock.calls

    expect(calls.find((call) => call[0] === 'from root')).toMatchObject([
      'from root',
      'error',
      {
        parent: document,
        document: document,
        path: [],
        type: rootType,
      },
    ])
    expect(calls.find((call) => call[0] === 'from level 1 object')).toMatchObject([
      'from level 1 object',
      'error',
      {
        parent: value,
        document: document,
        path: ['level1Object'],
        type: level1ObjectType,
      },
    ])
    expect(calls.find((call) => call[0] === 'from level 2 via object')).toMatchObject([
      'from level 2 via object',
      'error',
      {
        parent: value.level1Object,
        document: document,
        path: ['level1Object', 'level2String'],
        type: level2StringType,
      },
    ])
    expect(calls.find((call) => call[0] === 'from level 1 array')).toMatchObject([
      'from level 1 array',
      'error',
      {
        parent: value,
        document: document,
        path: ['level1Array'],
        type: level1ArrayType,
      },
    ])
    expect(calls.find((call) => call[0] === 'from level 2 via array')).toMatchObject([
      'from level 2 via array',
      'error',
      {
        parent: value.level1Array[0],
        document: document,
        path: ['level1Array', 0, 'level2Number'],
        type: level2NumberType,
      },
    ])
  })
})

describe('validation behavior', () => {
  const getValidationMarkers = <TValue extends {_type: string}>(params: {
    value: TValue
    types: SchemaTypeDefinition[]
  }) => {
    const schema: Schema = createSchema({
      name: 'default',
      types: [
        {
          name: 'root',
          type: 'document',
          title: 'Root',
          fields: [{name: 'field', type: params.value._type}],
        },
        ...params.types,
      ],
    })

    // ensures there are no schema formatting issues
    // oxlint-disable-next-line no-explicit-any
    expect((schema as any)._validation).toHaveLength(0)

    const document: SanityDocument = {
      _id: 'document-id',
      _type: 'root',
      _createdAt: '2024-01-19T17:59:04.949Z',
      _updatedAt: '2024-01-19T17:59:04.949Z',
      _rev: 'rev',
      field: params.value,
    }

    return validateItem({
      getClient,
      schema,
      value: params.value,
      type: schema.get(params.value._type),
      document,
      parent: document,
      path: undefined,
      getDocumentExists: undefined,
      i18n: getFallbackLocaleSource(),
      environment: 'cli',
    })
  }

  it('warns if there are unknown fields in document, object, image, and file types', async () => {
    await expect(
      getValidationMarkers({
        types: [
          {
            type: 'object',
            name: 'myObject',
            fields: [{name: 'knownField', type: 'string'}],
          },
        ],
        value: {
          _type: 'myObject',
          knownField: 'this is fine!',
          unknownField: 'this is a warning',
        },
      }),
    ).resolves.toMatchObject([
      {
        level: 'warning',
        message: "Field 'unknownField' does not exist on type 'myObject'",
        path: ['unknownField'],
      },
    ])

    await expect(
      getValidationMarkers({
        types: [
          {
            type: 'document',
            name: 'myDocument',
            fields: [{name: 'knownField', type: 'string'}],
          },
        ],
        value: {
          _type: 'myDocument',
          knownField: 'this is fine!',
          unknownField: 'this is a warning',
        },
      }),
    ).resolves.toMatchObject([
      {
        level: 'warning',
        message: "Field 'unknownField' does not exist on type 'myDocument'",
        path: ['unknownField'],
      },
    ])

    await expect(
      getValidationMarkers({
        types: [
          {
            type: 'image',
            name: 'myImage',
            fields: [{name: 'knownField', type: 'string'}],
          },
        ],
        value: {
          _type: 'myImage',
          knownField: 'this is fine!',
          unknownField: 'this is a warning',
        },
      }),
    ).resolves.toMatchObject([
      {
        level: 'warning',
        message: "Field 'unknownField' does not exist on type 'myImage'",
        path: ['unknownField'],
      },
    ])

    await expect(
      getValidationMarkers({
        types: [
          {
            type: 'file',
            name: 'myFile',
            fields: [{name: 'knownField', type: 'string'}],
          },
        ],
        value: {
          _type: 'myFile',
          knownField: 'this is fine!',
          unknownField: 'this is a warning',
        },
      }),
    ).resolves.toMatchObject([
      {
        level: 'warning',
        message: "Field 'unknownField' does not exist on type 'myFile'",
        path: ['unknownField'],
      },
    ])
  })

  it('warns if there are unknown fields in types that extend document, object, image, and file types', async () => {
    await expect(
      getValidationMarkers({
        types: [
          {
            type: 'object',
            name: 'myObject',
            fields: [{name: 'knownField', type: 'string'}],
          },
          {
            type: 'myObject',
            name: 'objectAlias',
          },
        ],
        value: {
          _type: 'objectAlias',
          knownField: 'this is fine!',
          unknownField: 'this is a warning',
        },
      }),
    ).resolves.toMatchObject([
      {
        level: 'warning',
        message: "Field 'unknownField' does not exist on type 'objectAlias'",
        path: ['unknownField'],
      },
    ])
  })
})
