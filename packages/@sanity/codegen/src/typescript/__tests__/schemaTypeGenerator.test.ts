import {CodeGenerator} from '@babel/generator'
import * as t from '@babel/types'
import {type TypeNode} from 'groq-js'
import {describe, expect, test} from 'vitest'

import {SchemaTypeGenerator, walkAndCountQueryTypeNodeStats} from '../schemaTypeGenerator'

function generateCode(node: t.Node | undefined) {
  if (!node) throw new Error('Node is undefined')
  return new CodeGenerator(node).generate().code.trim()
}

describe(SchemaTypeGenerator.name, () => {
  test('takes in a schema and pre-computes all TS types and identifiers', () => {
    const schema = new SchemaTypeGenerator([
      {
        type: 'type',
        name: 'foo',
        value: {
          type: 'object',
          attributes: {
            _id: {type: 'objectAttribute', value: {type: 'string'}},
            _type: {type: 'objectAttribute', value: {type: 'string', value: 'foo'}},
            foo: {type: 'objectAttribute', value: {type: 'string'}, optional: true},
          },
        },
      },
      {
        type: 'type',
        name: 'bar',
        value: {
          type: 'object',
          attributes: {
            _id: {type: 'objectAttribute', value: {type: 'string'}},
            _type: {type: 'objectAttribute', value: {type: 'string', value: 'bar'}},
            bar: {type: 'objectAttribute', value: {type: 'string'}, optional: true},
          },
        },
      },
    ])

    expect(schema.typeNames()).toEqual(['foo', 'bar'])
    expect(schema.getType('foo')).toEqual({
      id: {name: 'Foo', type: 'Identifier'},
      tsType: {
        type: 'TSTypeLiteral',
        members: [
          {
            key: {name: '_id', type: 'Identifier'},
            type: 'TSPropertySignature',
            typeAnnotation: {type: 'TSTypeAnnotation', typeAnnotation: {type: 'TSStringKeyword'}},
          },
          {
            key: {name: '_type', type: 'Identifier'},
            type: 'TSPropertySignature',
            typeAnnotation: {
              type: 'TSTypeAnnotation',
              typeAnnotation: {
                literal: {type: 'StringLiteral', value: 'foo'},
                type: 'TSLiteralType',
              },
            },
          },
          {
            key: {name: 'foo', type: 'Identifier'},
            optional: true,
            type: 'TSPropertySignature',
            typeAnnotation: {
              type: 'TSTypeAnnotation',
              typeAnnotation: {type: 'TSStringKeyword'},
            },
          },
        ],
      },
    })
    expect(schema.hasType('baz')).toBe(false)
    expect(schema.getType('baz')).toBe(undefined)
  })

  test('throws an error if a schema has a duplicate type name', () => {
    expect(
      () =>
        new SchemaTypeGenerator([
          {
            type: 'type',
            name: 'post',
            value: {
              type: 'object',
              attributes: {foo: {type: 'objectAttribute', value: {type: 'string'}}},
            },
          },
          {
            type: 'document',
            name: 'post',
            attributes: {foo: {type: 'objectAttribute', value: {type: 'string'}}},
          },
        ]),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: Duplicate type name "post" in schema. Type names must be unique within the same schema.]`,
    )
  })

  test('handles collisions when more than one type name sanitizes to the same identifier', () => {
    const schema = new SchemaTypeGenerator([
      {
        type: 'type',
        name: 'foo.bar',
        value: {
          type: 'object',
          attributes: {foo: {type: 'objectAttribute', value: {type: 'string'}}},
        },
      },
      {
        type: 'type',
        name: 'foo-bar',
        value: {
          type: 'object',
          attributes: {bar: {type: 'objectAttribute', value: {type: 'number'}}},
        },
      },
      {
        type: 'type',
        name: 'foo--bar',
        value: {
          type: 'object',
          attributes: {baz: {type: 'objectAttribute', value: {type: 'number'}}},
        },
      },
    ])
    const typeNames = schema.typeNames()
    expect(typeNames.length).toBe(3)
    expect(new Set(typeNames).size).toBe(3) // ensure type names are unique

    const [first, second, third] = Array.from(schema)
    expect(first.id.name).toBe('FooBar')
    expect(second.id.name).toBe('FooBar_2')
    expect(third.id.name).toBe('FooBar_3')
  })

  describe('generateTsType', () => {
    test('generates TS Types for strings', () => {
      const schema = new SchemaTypeGenerator([
        {
          type: 'type',
          name: 'stringAlias',
          value: {
            type: 'string',
          },
        },
        {
          type: 'type',
          name: 'stringLiteralAlias',
          value: {
            type: 'string',
            value: 'literalValue',
          },
        },
      ])

      const stringAlias = schema.getType('stringAlias')?.tsType
      const stringLiteralAlias = schema.getType('stringLiteralAlias')?.tsType

      expect(generateCode(stringAlias)).toMatchInlineSnapshot(`"string"`)
      expect(generateCode(stringLiteralAlias)).toMatchInlineSnapshot(`""literalValue""`)
    })

    test('generates TS Types for numbers', () => {
      const schema = new SchemaTypeGenerator([
        {
          type: 'type',
          name: 'numberAlias',
          value: {
            type: 'number',
          },
        },
        {
          type: 'type',
          name: 'numberLiteralAlias',
          value: {
            type: 'number',
            value: 123,
          },
        },
      ])

      const numberAlias = schema.getType('numberAlias')?.tsType
      const numberLiteralAlias = schema.getType('numberLiteralAlias')?.tsType

      expect(generateCode(numberAlias)).toMatchInlineSnapshot(`"number"`)
      expect(generateCode(numberLiteralAlias)).toMatchInlineSnapshot(`"123"`)
    })

    test('generates TS Types for booleans', () => {
      const schema = new SchemaTypeGenerator([
        {
          type: 'type',
          name: 'booleanAlias',
          value: {
            type: 'boolean',
          },
        },
        {
          type: 'type',
          name: 'booleanLiteralAlias',
          value: {
            type: 'boolean',
            value: true,
          },
        },
      ])

      const booleanAlias = schema.getType('booleanAlias')?.tsType
      const booleanLiteralAlias = schema.getType('booleanLiteralAlias')?.tsType

      expect(generateCode(booleanAlias)).toMatchInlineSnapshot(`"boolean"`)
      expect(generateCode(booleanLiteralAlias)).toMatchInlineSnapshot(`"true"`)
    })

    test('generates TS Types for unknown', () => {
      const schema = new SchemaTypeGenerator([
        {
          type: 'type',
          name: 'unknownAlias',
          value: {
            type: 'unknown',
          },
        },
      ])

      const unknownAlias = schema.getType('unknownAlias')?.tsType

      expect(generateCode(unknownAlias)).toMatchInlineSnapshot(`"unknown"`)
    })

    test('generates TS Types for null', () => {
      const schema = new SchemaTypeGenerator([
        {
          type: 'type',
          name: 'nullAlias',
          value: {
            type: 'null',
          },
        },
      ])

      const nullAlias = schema.getType('nullAlias')?.tsType

      expect(generateCode(nullAlias)).toMatchInlineSnapshot(`"null"`)
    })

    test('generates TS Types for arrays', () => {
      const schema = new SchemaTypeGenerator([
        {
          type: 'type',
          name: 'arrayAlias',
          value: {
            type: 'array',
            of: {
              type: 'string',
            },
          },
        },
      ])

      const arrayAlias = schema.getType('arrayAlias')?.tsType

      expect(generateCode(arrayAlias)).toMatchInlineSnapshot(`"Array<string>"`)
    })

    test('generates TS Types for documents', () => {
      const schema = new SchemaTypeGenerator([
        {
          type: 'document',
          name: 'post',
          attributes: {
            _id: {type: 'objectAttribute', value: {type: 'string'}},
            _type: {type: 'objectAttribute', value: {type: 'string', value: 'post'}},
            _createdAt: {type: 'objectAttribute', value: {type: 'string'}},
            _updatedAt: {type: 'objectAttribute', value: {type: 'string'}},
            _rev: {type: 'objectAttribute', value: {type: 'string'}},
            title: {type: 'objectAttribute', value: {type: 'string'}, optional: true},
          },
        },
      ])

      const post = schema.getType('post')?.tsType

      expect(generateCode(post)).toMatchInlineSnapshot(`
        "{
          _id: string;
          _type: "post";
          _createdAt: string;
          _updatedAt: string;
          _rev: string;
          title?: string;
        }"
      `)
    })

    test('generates TS Types for unions', () => {
      const schema = new SchemaTypeGenerator([
        {
          type: 'type',
          name: 'unionAlias',
          value: {type: 'union', of: [{type: 'string'}, {type: 'number'}]},
        },
        {
          type: 'type',
          name: 'emptyUnionAlias',
          value: {type: 'union', of: []},
        },
        {
          type: 'type',
          name: 'unionOfOneAlias',
          value: {type: 'union', of: [{type: 'string'}]},
        },
      ])

      const unionAlias = schema.getType('unionAlias')?.tsType
      const emptyUnionAlias = schema.getType('emptyUnionAlias')?.tsType
      const unionOfOneAlias = schema.getType('unionOfOneAlias')?.tsType

      expect(generateCode(unionAlias)).toMatchInlineSnapshot(`"string | number"`)
      expect(generateCode(emptyUnionAlias)).toMatchInlineSnapshot(`"never"`)
      expect(generateCode(unionOfOneAlias)).toMatchInlineSnapshot(`"string"`)
      expect(t.isTSStringKeyword(unionOfOneAlias)).toBe(true)
    })

    test('generates TS Types for inline types', () => {
      const schema = new SchemaTypeGenerator([
        {
          type: 'type',
          name: 'inlineAlias',
          value: {type: 'inline', name: 'person'},
        },
        {
          type: 'type',
          name: 'person',
          value: {
            type: 'object',
            attributes: {
              name: {type: 'objectAttribute', value: {type: 'string'}},
              age: {type: 'objectAttribute', value: {type: 'number'}},
            },
          },
        },
        {
          type: 'type',
          name: 'inlineAliasWithNoMatchingType',
          value: {type: 'inline', name: 'noMatchingType'},
        },
      ])

      const inlineAlias = schema.getType('inlineAlias')?.tsType
      const inlineAliasWithNoMatchingType = schema.getType('inlineAliasWithNoMatchingType')?.tsType

      expect(generateCode(inlineAlias)).toMatchInlineSnapshot(`"Person"`)
      expect(generateCode(inlineAliasWithNoMatchingType)).toMatchInlineSnapshot(
        `"unknown // Unable to locate the referenced type "noMatchingType" in schema"`,
      )
    })

    test('generates TS Types for objects', () => {
      const schema = new SchemaTypeGenerator([
        {
          type: 'type',
          name: 'objectAlias',
          value: {
            type: 'object',
            attributes: {name: {type: 'objectAttribute', value: {type: 'string'}}},
          },
        },
        {
          type: 'type',
          name: 'objectWithUnknownRest',
          value: {
            type: 'object',
            attributes: {name: {type: 'objectAttribute', value: {type: 'string'}}},
            rest: {type: 'unknown'},
          },
        },
        {
          type: 'type',
          name: 'objectWithInlineRest',
          value: {
            type: 'object',
            attributes: {name: {type: 'objectAttribute', value: {type: 'string'}}},
            rest: {type: 'inline', name: 'person'},
          },
        },
        {
          type: 'type',
          name: 'objectWithUnresolvableInlineRest',
          value: {
            type: 'object',
            attributes: {name: {type: 'objectAttribute', value: {type: 'string'}}},
            rest: {type: 'inline', name: 'unresolvableInlineRest'},
          },
        },
        {
          type: 'type',
          name: 'objectWithObjectRest',
          value: {
            type: 'object',
            attributes: {name: {type: 'objectAttribute', value: {type: 'string'}}},
            rest: {
              type: 'object',
              attributes: {
                foo: {type: 'objectAttribute', value: {type: 'string'}},
                bar: {type: 'objectAttribute', value: {type: 'number'}},
              },
            },
          },
        },
        {
          type: 'type',
          name: 'person',
          value: {
            type: 'object',
            attributes: {
              name: {type: 'objectAttribute', value: {type: 'string'}},
              age: {type: 'objectAttribute', value: {type: 'number'}},
            },
          },
        },
        {
          type: 'type',
          name: 'dereferenceableObject',
          value: {
            type: 'object',
            attributes: {
              _ref: {
                type: 'objectAttribute',
                value: {
                  type: 'string',
                },
              },
              _type: {
                type: 'objectAttribute',
                value: {
                  type: 'string',
                  value: 'reference',
                },
              },
            },
            dereferencesTo: 'person',
          },
        },
      ])

      const objectAlias = schema.getType('objectAlias')?.tsType
      const objectWithUnknownRest = schema.getType('objectWithUnknownRest')?.tsType
      const objectWithInlineRest = schema.getType('objectWithInlineRest')?.tsType
      const objectWithUnresolvableInlineRest = schema.getType(
        'objectWithUnresolvableInlineRest',
      )?.tsType
      const objectWithObjectRest = schema.getType('objectWithObjectRest')?.tsType
      const dereferenceableObject = schema.getType('dereferenceableObject')?.tsType

      expect(generateCode(objectAlias)).toMatchInlineSnapshot(`
        "{
          name: string;
        }"
      `)
      expect(generateCode(objectWithUnknownRest)).toMatchInlineSnapshot(`"unknown"`)
      expect(generateCode(objectWithInlineRest)).toMatchInlineSnapshot(
        `
        "{
          name: string;
        } & Person"
      `,
      )
      expect(generateCode(objectWithUnresolvableInlineRest)).toMatchInlineSnapshot(
        `"unknown // Unable to locate the referenced type "unresolvableInlineRest" in schema"`,
      )
      expect(generateCode(objectWithObjectRest)).toMatchInlineSnapshot(`
        "{
          name: string;
          foo: string;
          bar: number;
        }"
      `)
      expect(generateCode(dereferenceableObject)).toMatchInlineSnapshot(`
        "{
          _ref: string;
          _type: "reference";
          [internalGroqTypeReferenceTo]?: "person";
        }"
      `)
    })
  })

  describe('evaluateQuery', () => {
    test('evaluates a query against the schema and returns the TS Type and stats', () => {
      const schema = new SchemaTypeGenerator([
        {
          type: 'document',
          name: 'post',
          attributes: {
            _id: {type: 'objectAttribute', value: {type: 'string'}},
            _type: {type: 'objectAttribute', value: {type: 'string', value: 'post'}},
            _createdAt: {type: 'objectAttribute', value: {type: 'string'}},
            _updatedAt: {type: 'objectAttribute', value: {type: 'string'}},
            title: {type: 'objectAttribute', value: {type: 'string'}, optional: true},
          },
        },
      ])

      const {tsType, stats} = schema.evaluateQuery({
        query: '*[_type == "post"]{_id, title}',
      })
      expect(generateCode(tsType)).toMatchInlineSnapshot(`
        "Array<{
          _id: string;
          title: string | null;
        }>"
      `)

      expect(stats).toMatchInlineSnapshot(`
        {
          "allTypes": 6,
          "emptyUnions": 0,
          "unknownTypes": 0,
        }
      `)
    })
  })

  describe('walkAndCountQueryTypeNodeStats', () => {
    test('counts unknown type', () => {
      const node: TypeNode = {type: 'unknown'}
      expect(walkAndCountQueryTypeNodeStats(node)).toEqual({
        allTypes: 1,
        unknownTypes: 1,
        emptyUnions: 0,
      })
    })

    test('counts primitive types', () => {
      const stringNode: TypeNode = {type: 'string'}
      const numberNode: TypeNode = {type: 'number'}
      const booleanNode: TypeNode = {type: 'boolean'}
      const nullNode: TypeNode = {type: 'null'}
      const expected = {allTypes: 1, unknownTypes: 0, emptyUnions: 0}
      expect(walkAndCountQueryTypeNodeStats(stringNode)).toEqual(expected)
      expect(walkAndCountQueryTypeNodeStats(numberNode)).toEqual(expected)
      expect(walkAndCountQueryTypeNodeStats(booleanNode)).toEqual(expected)
      expect(walkAndCountQueryTypeNodeStats(nullNode)).toEqual(expected)
    })

    test('counts array type', () => {
      const node: TypeNode = {type: 'array', of: {type: 'string'}}
      expect(walkAndCountQueryTypeNodeStats(node)).toEqual({
        allTypes: 2, // array + string
        unknownTypes: 0,
        emptyUnions: 0,
      })
    })

    test('counts array with unknown element type', () => {
      const node: TypeNode = {type: 'array', of: {type: 'unknown'}}
      expect(walkAndCountQueryTypeNodeStats(node)).toEqual({
        allTypes: 2, // array + unknown
        unknownTypes: 1,
        emptyUnions: 0,
      })
    })

    test('counts nested array type', () => {
      const node: TypeNode = {type: 'array', of: {type: 'array', of: {type: 'number'}}}
      expect(walkAndCountQueryTypeNodeStats(node)).toEqual({
        allTypes: 3, // outer array + inner array + number
        unknownTypes: 0,
        emptyUnions: 0,
      })
    })

    test('counts simple object type', () => {
      const node: TypeNode = {
        type: 'object',
        attributes: {foo: {type: 'objectAttribute', value: {type: 'string'}}},
      }
      expect(walkAndCountQueryTypeNodeStats(node)).toEqual({
        allTypes: 2, // object + string
        unknownTypes: 0,
        emptyUnions: 0,
      })
    })

    test('counts object type with multiple attributes', () => {
      const node: TypeNode = {
        type: 'object',
        attributes: {
          foo: {type: 'objectAttribute', value: {type: 'string'}},
          bar: {type: 'objectAttribute', value: {type: 'number'}},
        },
      }
      expect(walkAndCountQueryTypeNodeStats(node)).toEqual({
        allTypes: 3, // object + string + number
        unknownTypes: 0,
        emptyUnions: 0,
      })
    })

    test('counts object type with unknown rest', () => {
      const node: TypeNode = {
        type: 'object',
        attributes: {foo: {type: 'objectAttribute', value: {type: 'string'}}},
        rest: {type: 'unknown'},
      }
      // object + unknown rest = 2 types, 1 of which is unknown
      expect(walkAndCountQueryTypeNodeStats(node)).toEqual({
        allTypes: 2,
        unknownTypes: 1,
        emptyUnions: 0,
      })
    })

    test('counts object type with object rest', () => {
      const node: TypeNode = {
        type: 'object',
        attributes: {a: {type: 'objectAttribute', value: {type: 'string'}}},
        rest: {
          type: 'object',
          attributes: {b: {type: 'objectAttribute', value: {type: 'number'}}},
        },
      }
      expect(walkAndCountQueryTypeNodeStats(node)).toEqual({
        allTypes: 4, // outer object + string 'a' + rest object + rest number 'b'
        unknownTypes: 0,
        emptyUnions: 0,
      })
    })

    test('counts object type with non-unknown/non-object rest', () => {
      const node: TypeNode = {
        type: 'object',
        attributes: {a: {type: 'objectAttribute', value: {type: 'string'}}},
        rest: {type: 'inline', name: 'person'},
      }

      expect(walkAndCountQueryTypeNodeStats(node)).toEqual({
        allTypes: 3, // outer object + string 'a' + inline 'person'
        unknownTypes: 0,
        emptyUnions: 0,
      })
    })

    test('counts empty union type', () => {
      const node: TypeNode = {type: 'union', of: []}
      expect(walkAndCountQueryTypeNodeStats(node)).toEqual({
        allTypes: 1, // union
        unknownTypes: 0,
        emptyUnions: 1,
      })
    })

    test('counts simple union type', () => {
      const node: TypeNode = {type: 'union', of: [{type: 'string'}, {type: 'number'}]}
      expect(walkAndCountQueryTypeNodeStats(node)).toEqual({
        allTypes: 3, // union + string + number
        unknownTypes: 0,
        emptyUnions: 0,
      })
    })

    test('counts union type with unknown member', () => {
      const node: TypeNode = {type: 'union', of: [{type: 'string'}, {type: 'unknown'}]}
      expect(walkAndCountQueryTypeNodeStats(node)).toEqual({
        allTypes: 3, // union + string + unknown
        unknownTypes: 1,
        emptyUnions: 0,
      })
    })

    test('counts complex nested type', () => {
      const node: TypeNode = {
        type: 'array',
        of: {
          type: 'union',
          of: [
            {
              type: 'object',
              attributes: {
                a: {type: 'objectAttribute', value: {type: 'string'}},
                b: {type: 'objectAttribute', value: {type: 'unknown'}},
              },
              rest: {
                type: 'object',
                attributes: {
                  c: {type: 'objectAttribute', value: {type: 'boolean'}},
                },
                rest: {type: 'inline', name: 'person'},
              },
            },
            {type: 'number'},
            {type: 'array', of: {type: 'boolean'}},
          ],
        },
      }

      // Calculation breakdown:
      // array (1)
      // + union (1)
      // + object (1)
      // + string 'a' (1)
      // + unknown 'b' (1) => unknownTypes: 1
      // + rest object (1)
      // + boolean 'c' (1)
      // + inline 'person' rest (1)
      // + number (1)
      // + inner array (1)
      // + inner boolean (1)
      // = 11 total types
      expect(walkAndCountQueryTypeNodeStats(node)).toEqual({
        allTypes: 11,
        unknownTypes: 1,
        emptyUnions: 0,
      })
    })
  })
})
