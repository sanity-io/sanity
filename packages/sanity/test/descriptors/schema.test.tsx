import {createSchemaFromManifestTypes, ValidationError} from '@sanity/schema/_internal'
import {
  defineField,
  type FieldGroupDefinition,
  type FieldsetDefinition,
  type SchemaTypeDefinition,
} from '@sanity/types'
import {type ReactNode} from 'react'
import {assert, describe, expect, test} from 'vitest'

import {
  type EncodedNamedType,
  type ObjectField,
} from '../../../@sanity/schema/src/descriptors/types'
import {builtinSchema, createSchema, DESCRIPTOR_CONVERTER} from '../../src/core/schema'
import {Rule} from '../../src/core/validation'
import {expectManifestSchemaConversion} from './utils'

const findTypeInDesc = (
  name: string,
  descriptor: ReturnType<(typeof DESCRIPTOR_CONVERTER)['get']>,
) =>
  Object.values(descriptor.objectValues).find((val) => val.name === name) as
    | EncodedNamedType
    | undefined

const convertType = (...types: SchemaTypeDefinition[]): EncodedNamedType => {
  const schema = createSchema({name: 'custom', types})
  if (schema._validation?.length) {
    throw new Error(
      `Test contains invalid schema definition: ${JSON.stringify(schema._validation, null, 2)}`,
    )
  }

  const desc = DESCRIPTOR_CONVERTER.get(schema)
  expectManifestSchemaConversion(schema, desc)
  return findTypeInDesc(types[0].name, desc)!
}

// Separate function to test manifest conversion edge cases
const justConvertType = (...types: SchemaTypeDefinition[]): EncodedNamedType => {
  const schema = createSchema({name: 'custom', types})
  if (schema._validation?.length) {
    throw new Error(
      `Test contains invalid schema definition: ${JSON.stringify(schema._validation, null, 2)}`,
    )
  }

  const desc = DESCRIPTOR_CONVERTER.get(schema)

  return findTypeInDesc(types[0].name, desc)!
}

describe('Built-in schema', () => {
  const descriptor = DESCRIPTOR_CONVERTER.get(builtinSchema)
  const findType = (name: string) => findTypeInDesc(name, descriptor)

  test('Object', () => {
    const obj = findType('object')
    assert(obj)
    expect(obj.typeDef.jsonType).toBe('object')
    expect(obj.typeDef.title).toBe('Object')
  })
})

describe('Base features', () => {
  // Test that convertType correctly converts types (without manifest validation)
  test('justConvertType properly converts schema types', () => {
    const type = justConvertType({
      name: 'testType',
      type: 'string',
      title: 'Test Type',
      description: 'A test type',
      validation: (rule: any) => rule.required().min(5).max(10),
    })

    // Verify the conversion result matches expected structure
    expect(type).toBeDefined()
    expect(type.name).toBe('testType')
    expect(type.typeDef).toMatchObject({
      title: 'Test Type',
      description: 'A test type',
      validation: [
        {
          level: 'error',
          rules: [
            {type: 'required'},
            {type: 'minimum', value: '5'},
            {type: 'maximum', value: '10'},
          ],
        },
      ],
    })
  })
  describe('title', () => {
    test('undefined', () => {
      expect(convertType({name: 'foo', type: 'string'}).typeDef).toMatchObject({
        title: undefined,
      })
    })

    test('string', () => {
      expect(convertType({name: 'foo', type: 'string', title: 'Hello'}).typeDef).toMatchObject({
        title: 'Hello',
      })
    })
  })

  describe('description', () => {
    test('undefined', () => {
      expect(convertType({name: 'foo', type: 'string'}).typeDef).toMatchObject({
        description: undefined,
      })
    })

    test('string', () => {
      expect(
        convertType({name: 'foo', type: 'string', description: 'Hello'}).typeDef,
      ).toMatchObject({
        description: 'Hello',
      })
    })

    test('non-string', () => {
      expect(
        convertType({name: 'foo', type: 'string', description: 123 as unknown as string}).typeDef,
      ).toMatchObject({
        description: undefined,
      })
    })

    test('JSX', () => {
      expect(
        convertType({name: 'foo', type: 'string', description: <div>Hello</div>}).typeDef,
      ).toMatchObject({
        description: {__type: 'jsx', type: 'div', props: {children: 'Hello'}},
      })
    })

    test('custom JSX', () => {
      function Foo({bar, children}: {bar: number; children: ReactNode}) {
        return (
          <div>
            {bar} and {children}
          </div>
        )
      }

      expect(
        convertType({
          name: 'foo',
          type: 'string',
          description: (
            <Foo bar={1}>
              Hello <br /> <strong>world</strong>
            </Foo>
          ),
        }).typeDef,
      ).toMatchObject({
        description: {
          __type: 'jsx',
          type: 'Foo',
          props: {
            bar: {__type: 'number', value: '1'},
            children: [
              'Hello ',
              {__type: 'jsx', type: 'br', props: {}},
              ' ',
              {__type: 'jsx', type: 'strong', props: {children: 'world'}},
            ],
          },
        },
      })
    })
  })

  describe('readOnly', () => {
    test('undefined', () => {
      expect(convertType({name: 'foo', type: 'string'}).typeDef).toMatchObject({
        readOnly: undefined,
      })
    })

    test('true', () => {
      expect(convertType({name: 'foo', type: 'string', readOnly: true}).typeDef).toMatchObject({
        readOnly: true,
      })
    })

    test('false', () => {
      expect(convertType({name: 'foo', type: 'string', readOnly: false}).typeDef).toMatchObject({
        readOnly: undefined,
      })
    })

    test('non-boolean', () => {
      expect(
        convertType({name: 'foo', type: 'string', readOnly: 123 as unknown as boolean}).typeDef,
      ).toMatchObject({
        readOnly: undefined,
      })
    })

    test('conditional', () => {
      expect(
        convertType({name: 'foo', type: 'string', readOnly: () => true}).typeDef,
      ).toMatchObject({
        readOnly: {__type: 'function'},
      })
    })
  })

  describe('hidden', () => {
    test('undefined', () => {
      expect(convertType({name: 'foo', type: 'string'}).typeDef).toMatchObject({
        hidden: undefined,
      })
    })

    test('true', () => {
      expect(convertType({name: 'foo', type: 'string', hidden: true}).typeDef).toMatchObject({
        hidden: true,
      })
    })

    test('false', () => {
      expect(convertType({name: 'foo', type: 'string', hidden: false}).typeDef).toMatchObject({
        hidden: undefined,
      })
    })

    test('non-boolean', () => {
      expect(
        convertType({name: 'foo', type: 'string', hidden: 123 as unknown as boolean}).typeDef,
      ).toMatchObject({
        hidden: undefined,
      })
    })

    test('conditional', () => {
      expect(convertType({name: 'foo', type: 'string', hidden: () => true}).typeDef).toMatchObject({
        hidden: {__type: 'function'},
      })
    })
  })

  describe('options', () => {
    test('undefined', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
        }).typeDef,
      ).toMatchObject({options: undefined})
    })

    test('primitives', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          options: {
            a: true,
            b: false,
            c: 'hello',
            d: null,
            e: [true],
          } as object,
        }).typeDef,
      ).toMatchObject({options: {a: true, b: false, c: 'hello', d: null, e: [true]}})
    })

    test('numbers', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          options: {
            a: 123,
          } as object,
        }).typeDef,
      ).toMatchObject({options: {a: {__type: 'number', value: '123'}}})
    })

    test('function', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          options: {
            a: () => {},
          } as object,
        }).typeDef,
      ).toMatchObject({options: {a: {__type: 'function'}}})
    })

    test('cyclic', () => {
      const val: Record<string, unknown> = {}
      val.a = {b: val}
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          options: {
            val,
          } as object,
        }).typeDef,
      ).toMatchObject({options: {val: {a: {b: {__type: 'cyclic'}}}}})
    })

    test('object with __type', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          options: {
            foo: {__type: 'yes'},
          } as object,
        }).typeDef,
      ).toMatchObject({options: {foo: {__type: 'object', value: {__type: 'yes'}}}})
    })

    test('max depth', () => {
      const val = {a: {b: {c: {d: {e: {f: {}}}}}}}
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          options: {
            val,
          } as object,
        }).typeDef,
      ).toMatchObject({options: {val: {a: {b: {c: {d: {__type: 'maxDepth'}}}}}}})
    })
  })

  describe('initialValue', () => {
    // NOTE: We don't have much coverage here, but this is being handled the exact same way as `options`.
    // We should consider refactoring these tests to be able to cover it here as well.

    test('undefined', () => {
      expect(convertType({name: 'foo', type: 'string'}).typeDef).toMatchObject({
        initialValue: undefined,
      })
    })

    test('string', () => {
      expect(
        convertType({name: 'foo', type: 'string', initialValue: 'hello'}).typeDef,
      ).toMatchObject({
        initialValue: 'hello',
      })
    })
  })

  describe('deprecated', () => {
    test('undefined', () => {
      expect(convertType({name: 'foo', type: 'string'}).typeDef).toMatchObject({
        deprecated: undefined,
      })
    })

    test('with reason', () => {
      expect(
        convertType({name: 'foo', type: 'string', deprecated: {reason: 'Hello'}}).typeDef,
      ).toMatchObject({
        deprecated: {reason: 'Hello'},
      })
    })

    test('without reason', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          deprecated: {REASON: 'Hello'} as unknown as {reason: string},
        }).typeDef,
      ).toMatchObject({
        deprecated: undefined,
      })
    })

    test('with non-object', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          deprecated: 123 as unknown as {reason: string},
        }).typeDef,
      ).toMatchObject({
        deprecated: undefined,
      })
    })

    test('with non-string reason', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          deprecated: {reason: 123} as unknown as {reason: string},
        }).typeDef,
      ).toMatchObject({
        deprecated: undefined,
      })
    })
  })

  describe('placeholder', () => {
    test('undefined', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
        }).typeDef,
      ).toMatchObject({
        placeholder: undefined,
      })
    })

    test('string', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          placeholder: 'Holder of Place',
        }).typeDef,
      ).toMatchObject({
        placeholder: 'Holder of Place',
      })
    })

    test('non-string', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          placeholder: 123 as unknown as string,
        }).typeDef,
      ).toMatchObject({
        placeholder: undefined,
      })
    })
  })

  describe('validation', () => {
    test('undefined', () => {
      expect(convertType({name: 'foo', type: 'string'}).typeDef).toMatchObject({
        validation: undefined,
      })
    })

    test('simple required validation', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          validation: (rule: any) => rule.required(),
        }).typeDef,
      ).toMatchObject({
        validation: [
          {
            level: 'error',
            rules: [{type: 'required'}],
          },
        ],
      })
    })

    test('required with custom message', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          validation: (rule: any) => rule.required().error('This field is required'),
        }).typeDef,
      ).toMatchObject({
        validation: [
          {
            level: 'error',
            message: 'This field is required',
            rules: [{type: 'required'}],
          },
        ],
      })
    })

    test('required with warning level', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          validation: (rule: any) => rule.required().warning(),
        }).typeDef,
      ).toMatchObject({
        validation: [
          {
            level: 'warning',
            rules: [{type: 'required'}],
          },
        ],
      })
    })

    test('required with info level', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          validation: (rule: any) => rule.required().info(),
        }).typeDef,
      ).toMatchObject({
        validation: [
          {
            level: 'info',
            rules: [{type: 'required'}],
          },
        ],
      })
    })

    test('multiple rules in chain', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          validation: (rule: any) => rule.required().min(5).max(10),
        }).typeDef,
      ).toMatchObject({
        validation: [
          {
            level: 'error',
            rules: [
              {type: 'required'},
              {type: 'minimum', value: '5'},
              {type: 'maximum', value: '10'},
            ],
          },
        ],
      })
    })

    test('array of validations', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          validation: [
            (rule: any) => rule.required(),
            (rule: any) => rule.min(5).warning('Should be at least 5 characters'),
          ],
        }).typeDef,
      ).toMatchObject({
        validation: [
          {
            level: 'error',
            rules: [{type: 'required'}],
          },
          {
            level: 'warning',
            message: 'Should be at least 5 characters',
            rules: [{type: 'minimum', value: '5'}],
          },
        ],
      })
    })

    // This succeeds because transformValidation is not applied to the child validations
    // See packages/sanity/src/_internal/manifest/extractWorkspaceManifest.tsx (transformValidation) for more details.
    test('email validation in nested all', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          validation: new Rule().all([new Rule().email()]),
        }).typeDef,
      ).toMatchObject({
        validation: [
          {
            level: 'error',
            rules: [
              {
                type: 'allOf',
                children: [
                  {
                    level: 'error',
                    rules: [
                      {
                        type: 'email',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      })
    })

    test('email validation in nested all as function', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          validation: (rule: any) => rule.all([rule.email()]),
        }).typeDef,
      ).toMatchObject({
        validation: [
          {
            level: 'error',
            rules: [
              {
                type: 'allOf',
                children: [
                  {
                    level: 'error',
                    rules: [
                      {
                        type: 'email',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      })
    })

    test('string casing validations', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          validation: (rule: any) => rule.uppercase(),
        }).typeDef,
      ).toMatchObject({
        validation: [
          {
            level: 'error',
            rules: [{type: 'uppercase'}],
          },
        ],
      })

      expect(
        convertType({
          name: 'bar',
          type: 'string',
          validation: (rule: any) => rule.lowercase(),
        }).typeDef,
      ).toMatchObject({
        validation: [
          {
            level: 'error',
            rules: [{type: 'lowercase'}],
          },
        ],
      })
    })

    test('length validation', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          validation: (rule: any) => rule.length(10),
        }).typeDef,
      ).toMatchObject({
        validation: [
          {
            level: 'error',
            rules: [{type: 'length', value: '10'}],
          },
        ],
      })
    })

    test('precision validation', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'number',
          validation: (rule: any) => rule.precision(2),
        }).typeDef,
      ).toMatchObject({
        validation: [
          {
            level: 'error',
            rules: [{type: 'precision', value: '2'}],
          },
        ],
      })
    })

    test('regex validation', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          validation: (rule: any) => rule.regex(/^[A-Z]+$/),
        }).typeDef,
      ).toMatchObject({
        validation: [
          {
            level: 'error',
            rules: [{type: 'regex', pattern: '^[A-Z]+$'}],
          },
        ],
      })
    })

    test('regex validation with flags', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          validation: (rule: any) => rule.regex(/^[a-z]+$/i),
        }).typeDef,
      ).toMatchObject({
        validation: [
          {
            level: 'error',
            rules: [{type: 'regex', pattern: '^[a-z]+$'}],
          },
        ],
      })
    })

    test('regex with invert', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          validation: (rule: any) => rule.regex(/^[0-9]+$/, {invert: true}),
        }).typeDef,
      ).toMatchObject({
        validation: [
          {
            level: 'error',
            rules: [{type: 'regex', pattern: '^[0-9]+$', invert: true}],
          },
        ],
      })
    })

    test('uri validation', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          validation: (rule: any) => rule.uri(),
        }).typeDef,
      ).toMatchObject({
        validation: [
          {
            level: 'error',
            rules: [{type: 'uri'}],
          },
        ],
      })
    })

    test('uri validation with options', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          validation: (rule: any) => rule.uri({allowRelative: true}),
        }).typeDef,
      ).toMatchObject({
        validation: [
          {
            level: 'error',
            rules: [{type: 'uri', allowRelative: true}],
          },
        ],
      })
    })

    test('enum validation (valid)', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          validation: (rule: any) => rule.valid(['draft', 'published', 'archived']),
        }).typeDef,
      ).toMatchObject({
        validation: [
          {
            level: 'error',
            rules: [{type: 'enum', values: ['draft', 'published', 'archived']}],
          },
        ],
      })
    })

    test('enum validation with mixed types', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          validation: (rule: any) => rule.valid(['active', 42, true]),
        }).typeDef,
      ).toMatchObject({
        validation: [
          {
            level: 'error',
            rules: [
              {
                type: 'enum',
                values: ['active', {__type: 'number', value: '42'}, true],
              },
            ],
          },
        ],
      })
    })

    test('assetRequired validation for images', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'image',
          validation: (rule: any) => rule.assetRequired(),
        }).typeDef,
      ).toMatchObject({
        validation: [
          {
            level: 'error',
            rules: [{type: 'assetRequired'}],
          },
        ],
      })
    })

    test('custom validation', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          validation: (rule: any) =>
            rule.custom((value: string) => {
              return value.startsWith('prefix_')
            }),
        }).typeDef,
      ).toMatchObject({
        validation: [
          {
            level: 'error',
            rules: [{type: 'custom'}],
          },
        ],
      })
    })

    test('custom validation with optional', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          validation: (rule: any) =>
            rule
              .custom((value: string) => {
                return value.startsWith('prefix_')
              })
              .optional(),
        }).typeDef,
      ).toMatchObject({
        validation: [
          {
            level: 'error',
            rules: [{type: 'custom', optional: true}],
          },
        ],
      })
    })

    test('all validation', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          validation: (rule: any) =>
            rule.all([rule.required(), rule.min(5), rule.max(10).warning('soft limit')]),
        }).typeDef,
      ).toMatchObject({
        validation: [
          {
            level: 'error',
            rules: [
              {
                type: 'allOf',
                children: [
                  {rules: [{type: 'required'}]},
                  {rules: [{type: 'minimum', value: '5'}]},
                  {rules: [{type: 'maximum', value: '10'}]},
                ],
              },
            ],
          },
        ],
      })
    })

    test('either validation', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          validation: (rule: any) =>
            rule.either([rule.required(), rule.min(5), rule.max(10).warning('soft limit')]),
        }).typeDef,
      ).toMatchObject({
        validation: [
          {
            level: 'error',
            rules: [
              {
                type: 'anyOf',
                children: [
                  {rules: [{type: 'required'}]},
                  {rules: [{type: 'minimum', value: '5'}]},
                  {rules: [{type: 'maximum', value: '10'}]},
                ],
              },
            ],
          },
        ],
      })
    })

    test('nested validation with messages', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          validation: (rule: any) =>
            rule
              .either([
                rule.email().error('Must be a valid email'),
                rule.uppercase().error('Must be uppercase'),
              ])
              .error('Must be either email or uppercase'),
        }).typeDef,
      ).toMatchObject({
        validation: [
          {
            level: 'error',
            message: 'Must be either email or uppercase',
            rules: [
              {
                type: 'anyOf',
                children: [
                  {message: 'Must be a valid email', rules: [{type: 'email'}]},
                  {
                    message: 'Must be uppercase',
                    rules: [{type: 'uppercase'}],
                  },
                ],
              },
            ],
          },
        ],
      })
    })

    test('exclusive min/max', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'number',
          validation: (rule: any) => rule.positive().lessThan(100),
        }).typeDef,
      ).toMatchObject({
        validation: [
          {
            level: 'error',
            rules: [
              {type: 'minimum', value: '0'},
              {type: 'exclusiveMaximum', value: '100'},
            ],
          },
        ],
      })
    })

    test('optional validation (no rules)', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          validation: (rule: any) => rule.optional(),
        }).typeDef,
      ).toMatchObject({
        validation: undefined,
      })
    })

    test('complex field validation for objects', () => {
      const objectType = convertType({
        name: 'person',
        type: 'object',
        fields: [
          {
            name: 'name',
            type: 'string',
            validation: (rule: any) => rule.required(),
          },
          {
            name: 'age',
            type: 'number',
            validation: (rule: any) => rule.required().min(0).max(150),
          },
          {
            name: 'handle',
            type: 'string',
            validation: (rule: any) => rule.uppercase().warning(),
          },
        ],
      })
      expect(objectType.typeDef).toMatchObject({
        fields: [
          {
            name: 'name',
            typeDef: {
              validation: [
                {
                  level: 'error',
                  rules: [{type: 'required'}],
                },
              ],
            },
          },
          {
            name: 'age',
            typeDef: {
              validation: [
                {
                  level: 'error',
                  rules: [
                    {type: 'required'},
                    {type: 'minimum', value: '0'},
                    {type: 'maximum', value: '150'},
                  ],
                },
              ],
            },
          },
          {
            name: 'handle',
            typeDef: {
              validation: [
                {
                  level: 'warning',
                  rules: [{type: 'uppercase'}],
                },
              ],
            },
          },
        ],
      })
    })

    test('array item validation', () => {
      const arrayType = convertType({
        name: 'tags',
        type: 'array',
        of: [
          {
            type: 'string',
            validation: (rule: any) => rule.required().min(2).max(20),
          },
        ],
        validation: (rule: any) => rule.min(1).max(10),
      })

      expect(arrayType.typeDef).toMatchObject({
        validation: [
          {
            level: 'error',
            rules: [
              {type: 'minimum', value: '1'},
              {type: 'maximum', value: '10'},
            ],
          },
        ],
        of: [
          {
            name: 'string',
            typeDef: {
              validation: [
                {
                  level: 'error',
                  rules: [
                    {type: 'required'},
                    {type: 'minimum', value: '2'},
                    {type: 'maximum', value: '20'},
                  ],
                },
              ],
            },
          },
        ],
      })
    })

    test('options', () => {
      const objectType = convertType({
        name: 'person',
        type: 'object',
        fields: [
          {
            title: 'List',
            name: 'list',
            type: 'string',
            options: {
              list: ['a', 'b', 'c'],
            },
            validation: [(rule: any) => rule.uri(), (rule: any) => rule.required()],
          },
        ],
      })

      assert(objectType?.typeDef?.fields)
      expect(objectType.typeDef.fields[0].typeDef.validation).toMatchObject([
        {
          level: 'error',
          rules: [
            {type: 'enum', values: ['a', 'b', 'c']},
            {type: 'uri', allowRelative: false},
          ],
        },
        {
          level: 'error',
          rules: [{type: 'enum', values: ['a', 'b', 'c']}, {type: 'required'}],
        },
      ])
    })

    test('options without validation', () => {
      const objectType = convertType({
        name: 'person',
        type: 'object',
        fields: [
          {
            title: 'List',
            name: 'list',
            type: 'string',
            options: {
              list: ['a', 'b', 'c'],
            },
          },
        ],
      })

      assert(objectType?.typeDef?.fields)
      expect(objectType.typeDef.fields[0].typeDef.validation).toMatchObject([
        {
          level: 'error',
          rules: [{type: 'enum', values: ['a', 'b', 'c']}],
        },
      ])
    })

    test('options with explict valid rule', () => {
      const objectType = convertType({
        name: 'person',
        type: 'object',
        fields: [
          {
            title: 'List',
            name: 'list',
            type: 'string',
            options: {
              list: ['a', 'b', 'c'],
            },
            validation: (rule: any) => rule.valid(['a', 'b', 'c']),
          },
        ],
      })

      assert(objectType?.typeDef?.fields)
      expect(objectType.typeDef.fields[0].typeDef.validation).toMatchObject([
        {
          level: 'error',
          rules: [{type: 'enum', values: ['a', 'b', 'c']}],
        },
      ])
    })

    test('references', () => {
      expect(
        convertType(
          {
            name: 'foo',
            type: 'reference',
            to: [{type: 'bar'}],
            validation: new Rule().reference(),
          },
          {name: 'bar', type: 'string'},
        ).typeDef.validation,
      ).toMatchObject([
        {
          level: 'error',
          rules: [{type: 'reference'}],
        },
      ])
    })
  })
})

describe('Document', () => {
  describe('liveEdit', () => {
    test('undefined', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'document',
          fields: [{name: 'title', type: 'string'}],
        }).typeDef,
      ).toMatchObject({
        liveEdit: undefined,
      })
    })
    test('true', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'document',
          fields: [{name: 'title', type: 'string'}],
          liveEdit: true,
        }).typeDef,
      ).toMatchObject({
        liveEdit: true,
      })
    })

    test('false', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'document',
          fields: [{name: 'title', type: 'string'}],
          liveEdit: false,
        }).typeDef,
      ).toMatchObject({
        liveEdit: undefined,
      })
    })

    test('non-boolean', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'document',
          fields: [{name: 'title', type: 'string'}],
          liveEdit: 123 as unknown as boolean,
        }).typeDef,
      ).toMatchObject({
        liveEdit: undefined,
      })
    })
  })
})

describe('Object', () => {
  test('fields', () => {
    // We place all the fields + the assertions for each converted field here.
    const fieldTests: Array<{field: any; assert: (field: ObjectField) => void}> = [
      {
        field: defineField({
          name: 'name',
          type: 'string',
        }),

        assert(field) {
          expect(field).toMatchObject({
            name: 'name',
            groups: undefined,
            fieldset: undefined,
          })
        },
      },
      {
        field: defineField({
          name: 'name2',
          type: 'string',
          group: 'a',
        }),
        assert(field) {
          expect(field).toMatchObject({
            name: 'name2',
            groups: ['a'],
            fieldset: undefined,
          })
        },
      },
      {
        field: defineField({
          name: 'name3',
          type: 'string',
          group: ['a', 'b'],
        }),
        assert(field) {
          expect(field).toMatchObject({
            name: 'name3',
            groups: ['a', 'b'],
            fieldset: undefined,
          })
        },
      },
      {
        field: defineField({
          name: 'name4',
          type: 'string',
          fieldset: 'f',
        }),

        assert(field) {
          expect(field).toMatchObject({
            name: 'name4',
            groups: undefined,
            fieldset: 'f',
          })
        },
      },
      {
        // Also check that other props are forwarded to the type:
        field: defineField({
          name: 'name5',
          type: 'string',
          hidden: true,
        }),

        assert(field) {
          expect(field.typeDef.hidden).toBe(true)
        },
      },
    ]

    const desc = convertType({
      name: 'person',
      type: 'object',
      fieldsets: [{name: 'f', title: 'Fieldset F'}],
      groups: [
        {name: 'a', title: 'Group A'},
        {name: 'b', title: 'Group B'},
      ],
      fields: fieldTests.map(({field}) => field),
    })

    expect(desc.typeDef.extends).toBe('object')
    assert(desc.typeDef.fields)
    expect(desc.typeDef.fields).toHaveLength(fieldTests.length)

    let i = 0
    for (const field of desc.typeDef.fields) {
      fieldTests[i].assert(field)
      i++
    }
  })

  describe('fieldsets', () => {
    test('ordering', () => {
      expect(
        convertType({
          name: 'person',
          type: 'object',
          fieldsets: [{name: 'b'}, {name: 'a'}],
          fields: [{name: 'title', type: 'string'}],
        }).typeDef.fieldsets,
      ).toMatchObject([{name: 'b'}, {name: 'a'}])
    })

    test.each<[string, FieldsetDefinition, unknown]>([
      [
        'only name',
        {name: 'f'},
        {
          name: 'f',
          title: undefined,
          description: undefined,
          group: undefined,
          hidden: undefined,
          readOnly: undefined,
          options: undefined,
        },
      ],
      ['title', {name: 'f', title: 'Hello'}, {name: 'f', title: 'Hello'}],
      [
        'title wrong type',
        {name: 'f', title: 123 as unknown as string},
        {name: 'f', title: undefined},
      ],
      ['description', {name: 'f', description: 'Hello'}, {name: 'f', description: 'Hello'}],
      [
        'description wrong type',
        {name: 'f', description: 123 as unknown as string},
        {name: 'f', description: undefined},
      ],
      ['group', {name: 'f', group: 'Hello'}, {name: 'f', group: 'Hello'}],
      [
        'group wrong type',
        {name: 'f', group: 123 as unknown as string},
        {name: 'f', group: undefined},
      ],
      ['hidden true', {name: 'f', hidden: true}, {name: 'f', hidden: true}],
      ['hidden false', {name: 'f', hidden: false}, {name: 'f', hidden: undefined}],
      ['readOnly true', {name: 'f', readOnly: true}, {name: 'f', readOnly: true}],
      ['readOnly false', {name: 'f', readOnly: false}, {name: 'f', readOnly: undefined}],
      [
        'options',
        {name: 'f', options: {collapsible: true}},
        {name: 'f', options: {collapsible: true}},
      ],
    ])('%s', (_, definition, expected) => {
      expect(
        convertType({
          name: 'person',
          type: 'object',
          fieldsets: [definition],
          fields: [{name: 'title', type: 'string'}],
        }).typeDef.fieldsets,
      ).toMatchObject([expected])
    })
  })

  describe('groups', () => {
    test.each<[string, FieldGroupDefinition, unknown]>([
      [
        'only name',
        {name: 'f'},
        {
          name: 'f',
          title: undefined,
          hidden: undefined,
        },
      ],
      ['title', {name: 'f', title: 'Hello'}, {name: 'f', title: 'Hello'}],
      [
        'title wrong type',
        {name: 'f', title: 123 as unknown as string},
        {name: 'f', title: undefined},
      ],
      ['hidden true', {name: 'f', hidden: true}, {name: 'f', hidden: true}],
      ['hidden false', {name: 'f', hidden: false}, {name: 'f', hidden: undefined}],
      ['hidden func', {name: 'f', hidden: () => false}, {name: 'f', hidden: {__type: 'function'}}],
      ['default true', {name: 'f', default: true}, {name: 'f', default: true}],
      ['default false', {name: 'f', default: false}, {name: 'f', default: undefined}],
    ])('%s', (_, definition, expected) => {
      expect(
        convertType({
          name: 'person',
          type: 'object',
          groups: [definition],
          fields: [{name: 'title', type: 'string'}],
        }).typeDef.groups,
      ).toMatchObject([expected])
    })

    describe('i18n', () => {
      test('basic i18n support', () => {
        expect(
          convertType({
            name: 'person',
            type: 'object',
            groups: [
              {
                name: 'settings',
                title: 'Settings',
                i18n: {
                  title: {key: 'groups.settings.title', ns: 'studio'},
                },
              },
            ],
            fields: [{name: 'title', type: 'string'}],
          }).typeDef.groups,
        ).toMatchObject([
          {
            name: 'settings',
            title: 'Settings',
            i18n: {
              title: {key: 'groups.settings.title', ns: 'studio'},
            },
          },
        ])
      })

      test('i18n with multiple fields', () => {
        expect(
          convertType({
            name: 'person',
            type: 'object',
            groups: [
              {
                name: 'advanced',
                title: 'Advanced Settings',
                i18n: {
                  title: {key: 'groups.advanced.title', ns: 'studio'},
                },
              },
            ],
            fields: [{name: 'title', type: 'string'}],
          }).typeDef.groups,
        ).toMatchObject([
          {
            name: 'advanced',
            title: 'Advanced Settings',
            i18n: {
              title: {key: 'groups.advanced.title', ns: 'studio'},
            },
          },
        ])
      })

      test('invalid i18n format is ignored', () => {
        expect(
          convertType({
            name: 'person',
            type: 'object',
            groups: [
              {
                name: 'settings',
                title: 'Settings',
                i18n: 'invalid',
              } as any,
            ],
            fields: [{name: 'title', type: 'string'}],
          }).typeDef.groups,
        ).toMatchObject([
          {
            name: 'settings',
            title: 'Settings',
            i18n: undefined,
          },
        ])
      })

      test('i18n with missing properties is ignored', () => {
        expect(
          convertType({
            name: 'person',
            type: 'object',
            groups: [
              {
                name: 'settings',
                title: 'Settings',
                i18n: {
                  title: {key: 'groups.settings.title'},
                },
              } as any,
            ],
            fields: [{name: 'title', type: 'string'}],
          }).typeDef.groups,
        ).toMatchObject([
          {
            name: 'settings',
            title: 'Settings',
            i18n: undefined,
          },
        ])
      })

      test('empty i18n object is ignored', () => {
        expect(
          convertType({
            name: 'person',
            type: 'object',
            groups: [
              {
                name: 'settings',
                title: 'Settings',
                i18n: {},
              },
            ],
            fields: [{name: 'title', type: 'string'}],
          }).typeDef.groups,
        ).toMatchObject([
          {
            name: 'settings',
            title: 'Settings',
            i18n: undefined,
          },
        ])
      })

      test('i18n combined with other properties', () => {
        expect(
          convertType({
            name: 'person',
            type: 'object',
            groups: [
              {
                name: 'settings',
                title: 'Settings',
                hidden: true,
                default: true,
                i18n: {
                  title: {key: 'groups.settings.title', ns: 'studio'},
                },
              },
            ],
            fields: [{name: 'title', type: 'string'}],
          }).typeDef.groups,
        ).toMatchObject([
          {
            name: 'settings',
            title: 'Settings',
            hidden: true,
            default: true,
            i18n: {
              title: {key: 'groups.settings.title', ns: 'studio'},
            },
          },
        ])
      })
    })
  })

  test.todo('orderings')
})

describe('Array', () => {
  describe('of', () => {
    test('single string', () => {
      expect(
        convertType({name: 'foo', type: 'array', of: [{type: 'string'}]}).typeDef.of,
      ).toMatchObject([
        {
          name: 'string',
          typeDef: {extends: 'string'},
        },
      ])
    })

    test('same type with different name ', () => {
      expect(
        convertType(
          {
            name: 'foo',
            type: 'array',
            of: [
              {name: 'bar1', type: 'bar'},
              {name: 'bar2', type: 'bar'},
            ],
          },
          {name: 'bar', type: 'object', fields: [{name: 'title', type: 'string'}]},
        ).typeDef.of,
      ).toMatchObject([
        {
          name: 'bar1',
          typeDef: {extends: 'bar'},
        },
        {
          name: 'bar2',
          typeDef: {extends: 'bar'},
        },
      ])
    })
  })
})

describe('Text', () => {
  describe('rows', () => {
    test('undefined', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'text',
        }).typeDef,
      ).toMatchObject({
        rows: undefined,
      })
    })

    test('number', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'text',
          rows: 5,
        }).typeDef,
      ).toMatchObject({
        rows: '5',
      })
    })

    test('non-number', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'text',
          rows: '5' as unknown as number,
        }).typeDef,
      ).toMatchObject({
        rows: undefined,
      })
    })
  })
})

describe('References', () => {
  test('reference', () => {
    expect(
      convertType(
        {name: 'foo', type: 'reference', to: [{type: 'person'}]},
        {name: 'person', type: 'document', fields: [{name: 'name', type: 'string'}]},
      ).typeDef,
    ).toMatchObject({
      to: [{name: 'person'}],
      fields: [
        {name: '_ref', typeDef: {extends: 'string'}},
        {name: '_weak', typeDef: {extends: 'boolean'}},
      ],
    })
  })

  test('crossDatasetReference', () => {
    expect(
      convertType({
        name: 'foo',
        type: 'crossDatasetReference',
        dataset: 'other',
        to: [{type: 'person', preview: {select: {title: 'title'}}}],
      }).typeDef,
    ).toMatchObject({
      to: [{name: 'person'}],
      fields: [
        {name: '_ref', typeDef: {extends: 'string'}},
        {name: '_weak', typeDef: {extends: 'boolean'}},
        {name: '_dataset', typeDef: {extends: 'string'}},
        {name: '_projectId', typeDef: {extends: 'string'}},
      ],
    })
  })

  test('globalDocumentReference', () => {
    expect(
      convertType({
        name: 'foo',
        type: 'globalDocumentReference',
        resourceType: 'media-library',
        resourceId: 'foo',
        to: [{title: 'Person', type: 'person', preview: {select: {title: 'title'}}}],
      }).typeDef,
    ).toMatchObject({
      to: [{name: 'person'}],
      fields: [
        {name: '_ref', typeDef: {extends: 'string'}},
        {name: '_weak', typeDef: {extends: 'boolean'}},
      ],
    })
  })
})

describe('Block', () => {
  test('default settings', () => {
    const type = convertType({
      name: 'paragraph',
      type: 'block',
    })

    assert(type.typeDef.fields)
    const style = type.typeDef.fields.find(({name}) => name === 'style')
    assert(style)
    expect(style.typeDef.extends).toBe('string')
    expect(style.typeDef.options).toEqual({
      list: [
        {
          title: 'Normal',
          value: 'normal',
          i18nTitleKey: 'inputs.portable-text.style.normal',
        },
        {
          i18nTitleKey: 'inputs.portable-text.style.h1',
          title: 'Heading 1',
          value: 'h1',
        },
        {
          i18nTitleKey: 'inputs.portable-text.style.h2',
          title: 'Heading 2',
          value: 'h2',
        },
        {
          i18nTitleKey: 'inputs.portable-text.style.h3',
          title: 'Heading 3',
          value: 'h3',
        },
        {
          i18nTitleKey: 'inputs.portable-text.style.h4',
          title: 'Heading 4',
          value: 'h4',
        },
        {
          i18nTitleKey: 'inputs.portable-text.style.h5',
          title: 'Heading 5',
          value: 'h5',
        },
        {
          i18nTitleKey: 'inputs.portable-text.style.h6',
          title: 'Heading 6',
          value: 'h6',
        },
        {
          i18nTitleKey: 'inputs.portable-text.style.quote',
          title: 'Quote',
          value: 'blockquote',
        },
      ],
    })

    const listItem = type.typeDef.fields.find(({name}) => name === 'listItem')
    assert(listItem)
    expect(listItem.typeDef.extends).toBe('string')
    expect(listItem.typeDef.options).toEqual({
      list: [
        {
          i18nTitleKey: 'inputs.portable-text.list-type.bullet',
          title: 'Bulleted list',
          value: 'bullet',
        },
        {
          i18nTitleKey: 'inputs.portable-text.list-type.number',
          title: 'Numbered list',
          value: 'number',
        },
      ],
    })

    const markDefs = type.typeDef.fields.find(({name}) => name === 'markDefs')
    assert(markDefs)
    expect(markDefs.typeDef.extends).toBe('array')
    assert(markDefs.typeDef.of)
    expect((markDefs.typeDef.of as any[]).map(({name}) => name)).toEqual(['link'])

    const level = type.typeDef.fields.find(({name}) => name === 'level')
    assert(level)
    expect(level.typeDef.extends).toBe('number')
  })

  test('custom settings', () => {
    const type = convertType({
      name: 'paragraph',
      type: 'block',
      styles: [{title: 'Quote', value: 'blockquote'}],
      lists: [{title: 'Star', value: 'star'}],
      marks: {
        decorators: [{title: 'Weak', value: 'weak'}],
        annotations: [
          {name: 'internalLink', type: 'object', fields: [{name: 'path', type: 'string'}]},
        ],
      },
    })

    assert(type.typeDef.fields)
    const style = type.typeDef.fields.find(({name}) => name === 'style')
    assert(style)
    expect(style.typeDef.extends).toBe('string')
    expect(style.typeDef.options).toEqual({
      list: [
        {
          title: 'Normal',
          value: 'normal',
          i18nTitleKey: 'inputs.portable-text.style.normal',
        },
        {
          title: 'Quote',
          value: 'blockquote',
        },
      ],
    })

    const listItem = type.typeDef.fields.find(({name}) => name === 'listItem')
    assert(listItem)
    expect(listItem.typeDef.extends).toBe('string')
    expect(listItem.typeDef.options).toEqual({
      list: [
        {
          title: 'Star',
          value: 'star',
        },
      ],
    })

    const markDefs = type.typeDef.fields.find(({name}) => name === 'markDefs')
    assert(markDefs)
    expect(markDefs.typeDef.extends).toBe('array')
    assert(markDefs.typeDef.of)
    expect((markDefs.typeDef.of as any[]).map(({name}) => name)).toEqual(['internalLink'])

    const level = type.typeDef.fields.find(({name}) => name === 'level')
    assert(level)
    expect(level.typeDef.extends).toBe('number')
  })
})

// Tests for full roundtrip conversion (schema → manifest → schema)
describe('Manifest roundtrip conversion', () => {
  test('basic types survive roundtrip conversion', () => {
    const type = convertType({
      name: 'basicString',
      type: 'string',
      title: 'Basic String Field', // Use a title that won't be stripped
      description: 'A basic string field',
      validation: (rule: any) => rule.required().min(1).max(100),
    })

    // Verify the type is properly converted and can roundtrip through manifest
    expect(type).toBeDefined()
    expect(type.name).toBe('basicString')
    expect(type.typeDef).toMatchObject({
      title: 'Basic String Field',
      description: 'A basic string field',
      validation: [
        {
          level: 'error',
          rules: [
            {type: 'required'},
            {type: 'minimum', value: '1'},
            {type: 'maximum', value: '100'},
          ],
        },
      ],
    })
  })

  test('complex object types survive roundtrip conversion', () => {
    const type = convertType({
      name: 'person',
      type: 'object',
      title: 'Person',
      fields: [
        {
          name: 'name',
          type: 'string',
          title: 'Name',
          validation: (rule: any) => rule.required(),
        },
        {
          name: 'age',
          type: 'number',
          title: 'Age',
          validation: (rule: any) => rule.min(0).max(150),
        },
      ],
    })

    expect(type).toBeDefined()
    expect(type.name).toBe('person')
    expect(type.typeDef).toMatchObject({
      title: 'Person',
      fields: [
        {
          name: 'name',
          typeDef: {
            title: 'Name',
            validation: [
              {
                level: 'error',
                rules: [{type: 'required'}],
              },
            ],
          },
        },
        {
          name: 'age',
          typeDef: {
            title: 'Age',
            validation: [
              {
                level: 'error',
                rules: [
                  {type: 'minimum', value: '0'},
                  {type: 'maximum', value: '150'},
                ],
              },
            ],
          },
        },
      ],
    })
  })
})

describe('createSchemaFromManifestTypes', () => {
  test('Ensures schema is valid', () => {
    expect(() => createSchemaFromManifestTypes({name: 'invalid', types: [{foo: 'bar'}]})).toThrow(
      new ValidationError([
        {
          path: [
            {
              kind: 'type',
              name: '<unnamed_type_@_index_0>',
              // type should be a string, but it is undefined.
              type: undefined as unknown as string,
            },
          ],
          problems: [
            {
              helpId: 'schema-type-missing-name-or-type',
              message: 'Missing type name',
              severity: 'error',
            },
            {
              helpId: 'schema-type-missing-name-or-type',
              message: 'Type is missing a type.',
              severity: 'error',
            },
          ],
        },
      ]),
    )
  })
})

// Tests for manifest conversion edge cases and limitations
describe('Manifest conversion limitations', () => {
  // These tests verify that certain validation rules are excluded during manifest extraction
  // See packages/sanity/src/_internal/manifest/extractWorkspaceManifest.tsx for implementation details

  describe('validation rules without constraint property', () => {
    // Email validation is defined as {flag: 'email'} without a constraint property
    test('email validation is excluded during manifest conversion', () => {
      const type = {
        name: 'foo',
        type: 'string',
        validation: new Rule().email(),
      }
      // First, verify that convertType includes the email validation
      expect(justConvertType(type).typeDef.validation).toMatchObject([
        {
          level: 'error',
          rules: [{type: 'email'}],
        },
      ])

      // But when going through manifest conversion, it's excluded
      // The roundtrip validation should fail because email validation is excluded
      expect(() => convertType(type)).toThrow()
    })

    test('email validation as function is excluded during manifest conversion', () => {
      const type = {
        name: 'foo',
        type: 'string',
        validation: (rule: any) => rule.email(),
      }
      // First, verify that convertType includes the email validation
      expect(justConvertType(type).typeDef.validation).toMatchObject([
        {
          level: 'error',
          rules: [{type: 'email'}],
        },
      ])

      // But when going through manifest conversion, it's excluded
      expect(() => convertType(type)).toThrow()
    })

    // Integer validation is defined as {flag: 'integer'} without a constraint property
    test('integer validation is excluded during manifest conversion', () => {
      const type = {
        name: 'foo',
        type: 'number',
        validation: new Rule().integer(),
      }

      expect(justConvertType(type).typeDef.validation).toMatchObject([
        {
          level: 'error',
          rules: [{type: 'integer'}],
        },
      ])

      expect(() => convertType(type)).toThrow()
    })

    // Unique validation is defined as {flag: 'unique'} without a constraint property
    test('unique validation is excluded during manifest conversion', () => {
      const type = {
        name: 'foo',
        type: 'array',
        of: [{type: 'string'}],
        validation: new Rule().unique(),
      }

      expect(justConvertType(type).typeDef.validation).toMatchObject([
        {
          level: 'error',
          rules: [{type: 'uniqueItems'}],
        },
      ])

      expect(() => convertType(type)).toThrow()
    })

    // However, email validation in nested all() is preserved because
    // transformValidation is not applied to child validations
    test('email validation in nested all is preserved', () => {
      expect(
        convertType({
          name: 'foo',
          type: 'string',
          validation: new Rule().all([new Rule().email()]),
        }).typeDef,
      ).toMatchObject({
        validation: [
          {
            level: 'error',
            rules: [
              {
                type: 'allOf',
                children: [
                  {
                    level: 'error',
                    rules: [
                      {
                        type: 'email',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      })
    })
  })

  describe('validation rules with field references', () => {
    // Field references use symbols which cannot be serialized
    test('min/max with field references are excluded during manifest conversion', () => {
      // First verify that convertType includes the field reference validation
      const type = {
        name: 'endDate',
        type: 'datetime',
        validation: (rule: any) => rule.min(rule.valueOfField('startDate')),
      }

      // The validation should include a field reference
      expect(justConvertType(type).typeDef.validation).toMatchObject([
        {
          level: 'error',
          rules: [
            {
              type: 'minimum',
              value: {
                type: 'fieldReference',
                path: ['startDate'],
              },
            },
          ],
        },
      ])

      // But manifest conversion should fail due to field reference
      expect(() => convertType(type)).toThrow()
    })
  })

  describe('validation with non-string messages', () => {
    // Localized messages (objects) are not supported in manifest extraction
    test('localized validation messages are converted to undefined during manifest conversion', () => {
      const type = {
        name: 'foo',
        type: 'string',
        validation: (rule: any) =>
          rule.required().error({
            'en': 'This field is required',
            'nb': 'Dette feltet er påkrevd',
            'nb-NO': 'Dette feltet er påkrevd',
          }),
      }
      // First verify that convertType includes the localized message
      expect(justConvertType(type).typeDef.validation).toMatchObject([
        {
          level: 'error',
          message: {
            'en': 'This field is required',
            'nb': 'Dette feltet er påkrevd',
            'nb-NO': 'Dette feltet er påkrevd',
          },
          rules: [{type: 'required'}],
        },
      ])

      // But manifest conversion should fail because localized messages are not supported
      expect(() => convertType(type)).toThrow()
    })
  })

  describe('validation with null in enum values', () => {
    test('enum validation with null values loses null during manifest conversion', () => {
      const type = {
        name: 'foo',
        type: 'string',
        validation: (rule: any) => rule.valid([null, 'value']),
      }
      // First verify that convertType includes null in the enum values
      expect(justConvertType(type).typeDef.validation).toMatchObject([
        {
          level: 'error',
          rules: [
            {
              type: 'enum',
              values: [null, 'value'],
            },
          ],
        },
      ])

      // Manifest conversion will lose the null value
      expect(() => convertType(type)).toThrow()
    })
  })
})
