/// <reference types="@sanity/types/parts" />

import {Rule, SchemaType, SanityDocument, Schema, ArraySchemaType} from '@sanity/types'
import createSchema from 'part:@sanity/base/schema-creator'
import validateDocument, {resolveTypeForArrayItem, validateItem} from './validateDocument'
import convertToValidationMarker from './util/convertToValidationMarker'

jest.mock('./util/convertToValidationMarker', () => {
  return jest.fn(jest.requireActual('./util/convertToValidationMarker').default)
})

beforeEach(() => {
  ;(convertToValidationMarker as jest.Mock).mockClear()
})

describe('resolveTypeForArrayItem', () => {
  const schema: Schema = createSchema({
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
      [fooType, barType]
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
      [fooType]
    )

    expect(resolved).toBe(fooType)
  })
})

describe('validateDocument', () => {
  it('takes in a document + a compiled schema and returns a list of validation markers', async () => {
    const schema = createSchema({
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

    const result = await validateDocument(document, schema)
    expect(result).toMatchObject([
      {
        type: 'validation',
        level: 'error',
        item: {
          message: 'Expected type "String", got "null"',
          paths: [],
        },
        path: ['title'],
      },
      {
        type: 'validation',
        level: 'error',
        item: {
          message: 'Required',
          paths: [],
        },
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
        {name: 'registeredString', type: 'string', validation},
        {
          name: 'registeredObjectField',
          type: 'object',
          fields: [{name: 'foo', type: 'string', validation}],
        },
      ],
    })

    await expect(
      validateItem({
        value: {},
        document: undefined,
        path: [],
        parent: undefined,
        type: schema.get('testObj'),
      })
    ).resolves.toMatchObject([
      {
        type: 'validation',
        level: 'error',
        item: {message: 'This is required!'},
        path: ['registeredString'],
      },
      {
        type: 'validation',
        level: 'error',
        item: {message: 'This is required!'},
        path: ['inlineString'],
      },
      {
        type: 'validation',
        level: 'error',
        item: {message: 'Required'},
        path: ['registeredObject'],
      },
      {
        type: 'validation',
        level: 'error',
        item: {message: 'This is required!'},
        path: ['registeredObject', 'foo'],
      },
      {
        type: 'validation',
        level: 'error',
        item: {message: 'Required'},
        path: ['inlineObject'],
      },
      {
        type: 'validation',
        level: 'error',
        item: {message: 'This is required!'},
        path: ['inlineObject', 'foo'],
      },
    ])
  })

  it('runs nested validation for object-level rules set via Rule.fields()', async () => {
    const schema = createSchema({
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

    await expect(
      validateItem({
        document: undefined,
        parent: undefined,
        path: undefined,
        type: schema.get('testObj'),
        value: {foo: 5},
      })
    ).resolves.toMatchObject([
      {
        item: {message: 'Expected type "String", got "Number"'},
        level: 'error',
        path: ['foo'],
        type: 'validation',
      },
      {
        item: {message: 'Required'},
        level: 'error',
        path: ['bar'],
        type: 'validation',
      },
    ])
  })

  it('resolves an array item type if there is just one type', async () => {
    const schema = createSchema({
      types: [
        {
          name: 'values',
          type: 'array',
          // note that there is only one type available
          of: [{type: 'arrayItem'}],
          validation: (rule: Rule) => rule.required(),
        },
        {
          name: 'arrayItem',
          type: 'object',
          fields: [{name: 'title', type: 'string'}],
        },
      ],
    })

    const values = [
      {
        // note how this doesn't have a _type
        title: 5,
        _key: 'exampleKey',
      },
    ]

    await expect(
      validateItem({
        document: undefined,
        parent: undefined,
        path: [],
        type: schema.get('values'),
        value: values,
      })
    ).resolves.toEqual([
      {
        type: 'validation',
        level: 'error',
        item: {
          message: 'Expected type "String", got "Number"',
          paths: [],
        },
        path: [{_key: 'exampleKey'}, 'title'],
      },
    ])
  })

  it('properly passes the nested value, type, and path to rule.validate', async () => {
    const schema: Schema = createSchema({
      types: [
        {
          name: 'root',
          type: 'object',
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
    const level1ObjectType = getField({in: rootType, name: 'level1Object'})
    const level2StringType = getField({in: level1ObjectType, name: 'level2String'})
    const level1ArrayType = getField({in: rootType, name: 'level1Array'})
    const level2NumberType = getField({
      in: (level1ArrayType as ArraySchemaType).of[0],
      name: 'level2Number',
    })

    await expect(
      validateItem({
        value,
        type: rootType,
        document,
        parent: document,
        path: undefined,
      })
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

    const calls = (convertToValidationMarker as jest.Mock).mock.calls

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

  it('runs all nested validation checks concurrently', async () => {
    type Resolver = (value: true) => void
    const resolvers = new Set<Resolver>()
    const customValidationFn = () => new Promise<true>((resolve) => resolvers.add(resolve))

    const schema: Schema = createSchema({
      types: [
        {
          name: 'root',
          type: 'object',
          fields: [
            {
              name: 'level1Object',
              type: 'object',
              validation: (rule: Rule) => [
                rule.custom(customValidationFn),
                rule.fields({
                  level2String: (r) => r.custom(customValidationFn),
                }),
              ],
              fields: [
                {
                  name: 'level2String',
                  type: 'string',
                  validation: (rule: Rule) => rule.custom(customValidationFn),
                },
              ],
            },
            {
              name: 'level1Array',
              type: 'array',
              validation: (rule: Rule) => rule.custom(customValidationFn),
              of: [
                {
                  type: 'object',
                  fields: [
                    {
                      name: 'level2Number',
                      type: 'number',
                      validation: (rule: Rule) => rule.custom(customValidationFn),
                    },
                  ],
                },
              ],
            },
          ],
          validation: (rule: Rule) => rule.custom(customValidationFn),
        },
      ],
    })

    const value = {
      level1Object: {level3String: 'a string'},
      level1Array: [{level2Number: 5}],
    }

    const resultPromise = validateItem({
      value,
      document: undefined,
      parent: undefined,
      path: undefined,
      type: schema.get('root'),
    })

    // after `validateItem(...)` has been initiated, all of the custom
    // validation calls should have fired so the resolver size should equal the
    // amount of total fields
    expect(resolvers.size).toBe(6)

    for (const resolver of resolvers) {
      resolver(true)
    }

    await resultPromise
  })
})
