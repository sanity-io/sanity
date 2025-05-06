/* eslint-disable max-nested-callbacks */
import {CodeGenerator} from '@babel/generator'
import * as t from '@babel/types'
import {type TypeNode} from 'groq-js'
import {describe, expect, it} from 'vitest'

import {SchemaTypeGenerator, walkAndCountQueryTypeNodeStats} from '../schemaTypeGenerator'

function generateCode(node: t.Node | undefined) {
  if (!node) throw new Error('Node is undefined')
  return new CodeGenerator(node).generate().code.trim()
}

describe('SchemaTypeGenerator', () => {
  it('throws an error if a schema has a duplicate type name', () => {
    expect(
      () =>
        new SchemaTypeGenerator({
          schemaId: 'default',
          schema: [
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
          ],
        }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: Duplicate type name "post" in schema "default". Type names must be unique within the same schema.]`,
    )
  })

  it('handles collisions when more than one type name sanitizes to the same identifier', () => {
    const schema = new SchemaTypeGenerator({
      schemaId: 'default',
      schema: [
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
      ],
    })
    const typeNames = schema.getTypeNames()
    expect(typeNames.length).toBe(3)
    expect(new Set(typeNames).size).toBe(3) // ensure type names are unique

    const [first, second, third] = typeNames
    expect(schema.getIdentifier(first)?.name).toBe('FooBar')
    expect(schema.getIdentifier(second)?.name).toBe('FooBar_2')
    expect(schema.getIdentifier(third)?.name).toBe('FooBar_3')
  })

  describe('generateTsType', () => {
    it('generates TS Types for strings', () => {
      const schema = new SchemaTypeGenerator({
        schemaId: 'default',
        schema: [
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
        ],
      })

      const stringAlias = schema.getTsType('stringAlias')
      const stringLiteralAlias = schema.getTsType('stringLiteralAlias')

      expect(generateCode(stringAlias)).toMatchInlineSnapshot(`"string"`)
      expect(generateCode(stringLiteralAlias)).toMatchInlineSnapshot(`""literalValue""`)
    })

    it('generates TS Types for numbers', () => {
      const schema = new SchemaTypeGenerator({
        schemaId: 'default',
        schema: [
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
        ],
      })

      const numberAlias = schema.getTsType('numberAlias')
      const numberLiteralAlias = schema.getTsType('numberLiteralAlias')

      expect(generateCode(numberAlias)).toMatchInlineSnapshot(`"number"`)
      expect(generateCode(numberLiteralAlias)).toMatchInlineSnapshot(`"123"`)
    })

    it('generates TS Types for booleans', () => {
      const schema = new SchemaTypeGenerator({
        schemaId: 'default',
        schema: [
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
        ],
      })

      const booleanAlias = schema.getTsType('booleanAlias')
      const booleanLiteralAlias = schema.getTsType('booleanLiteralAlias')

      expect(generateCode(booleanAlias)).toMatchInlineSnapshot(`"boolean"`)
      expect(generateCode(booleanLiteralAlias)).toMatchInlineSnapshot(`"true"`)
    })

    it('generates TS Types for unknown', () => {
      const schema = new SchemaTypeGenerator({
        schemaId: 'default',
        schema: [
          {
            type: 'type',
            name: 'unknownAlias',
            value: {
              type: 'unknown',
            },
          },
        ],
      })

      const unknownAlias = schema.getTsType('unknownAlias')

      expect(generateCode(unknownAlias)).toMatchInlineSnapshot(`"unknown"`)
    })

    it('generates TS Types for null', () => {
      const schema = new SchemaTypeGenerator({
        schemaId: 'default',
        schema: [
          {
            type: 'type',
            name: 'nullAlias',
            value: {
              type: 'null',
            },
          },
        ],
      })

      const nullAlias = schema.getTsType('nullAlias')

      expect(generateCode(nullAlias)).toMatchInlineSnapshot(`"null"`)
    })

    it('generates TS Types for arrays', () => {
      const schema = new SchemaTypeGenerator({
        schemaId: 'default',
        schema: [
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
        ],
      })

      const arrayAlias = schema.getTsType('arrayAlias')

      expect(generateCode(arrayAlias)).toMatchInlineSnapshot(`"Array<string>"`)
    })

    it('generates TS Types for documents', () => {
      const schema = new SchemaTypeGenerator({
        schemaId: 'default',
        schema: [
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
        ],
      })

      const post = schema.getTsType('post')

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

    it('generates TS Types for unions', () => {
      const schema = new SchemaTypeGenerator({
        schemaId: 'default',
        schema: [
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
        ],
      })

      const unionAlias = schema.getTsType('unionAlias')
      const emptyUnionAlias = schema.getTsType('emptyUnionAlias')
      const unionOfOneAlias = schema.getTsType('unionOfOneAlias')

      expect(generateCode(unionAlias)).toMatchInlineSnapshot(`"string | number"`)
      expect(generateCode(emptyUnionAlias)).toMatchInlineSnapshot(`"never"`)
      expect(generateCode(unionOfOneAlias)).toMatchInlineSnapshot(`"string"`)
      // ensure the code generator didn't simplify the union of one type
      expect(t.isTSStringKeyword(unionOfOneAlias)).toBe(true)
    })

    it('generates TS Types for inline types', () => {
      const schema = new SchemaTypeGenerator({
        schemaId: 'default',
        schema: [
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
        ],
      })

      const inlineAlias = schema.getTsType('inlineAlias')
      const inlineAliasWithNoMatchingType = schema.getTsType('inlineAliasWithNoMatchingType')

      expect(generateCode(inlineAlias)).toMatchInlineSnapshot(`"Person"`)
      expect(generateCode(inlineAliasWithNoMatchingType)).toMatchInlineSnapshot(
        `"unknown // Unable to locate the referenced type "noMatchingType" in schema "default""`,
      )
    })

    it('generates TS Types for objects', () => {
      const schema = new SchemaTypeGenerator({
        schemaId: 'default',
        schema: [
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
        ],
      })

      const objectAlias = schema.getTsType('objectAlias')
      const objectWithUnknownRest = schema.getTsType('objectWithUnknownRest')
      const objectWithInlineRest = schema.getTsType('objectWithInlineRest')
      const objectWithUnresolvableInlineRest = schema.getTsType('objectWithUnresolvableInlineRest')
      const objectWithObjectRest = schema.getTsType('objectWithObjectRest')
      const dereferenceableObject = schema.getTsType('dereferenceableObject')

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
        `"unknown // Unable to locate the referenced type "unresolvableInlineRest" in schema "default""`,
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
    it('evaluates a query against the schema and returns the TS Type and stats', () => {
      const schema = new SchemaTypeGenerator({
        schemaId: 'default',
        schema: [
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
        ],
      })

      const {tsType, stats} = schema.evaluateQuery('*[_type == "post"]{_id, title}')
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

  describe('evaluateProjection', () => {
    it('evaluates a projection against all schema types in a schema and returns the TS Type and stats', () => {
      const schema = new SchemaTypeGenerator({
        schemaId: 'default',
        schema: [
          {
            type: 'document',
            name: 'post',
            attributes: {
              _id: {type: 'objectAttribute', value: {type: 'string'}},
              _type: {type: 'objectAttribute', value: {type: 'string', value: 'post'}},
              title: {type: 'objectAttribute', value: {type: 'string'}},
              slug: {type: 'objectAttribute', value: {type: 'inline', name: 'slug'}},
              ignored: {type: 'objectAttribute', value: {type: 'null'}},
            },
          },
          // Note: this is not a document and it not supported
          {
            type: 'type',
            name: 'featuredItem',
            value: {
              type: 'object',
              attributes: {
                _type: {type: 'objectAttribute', value: {type: 'string', value: 'featuredItem'}},
                title: {type: 'objectAttribute', value: {type: 'string'}, optional: true},
                description: {type: 'objectAttribute', value: {type: 'string'}, optional: true},
              },
            },
          },
          // This type doesn't have _id or title, so it should be filtered out
          {
            type: 'type',
            name: 'slug',
            value: {
              type: 'object',
              attributes: {
                current: {type: 'objectAttribute', value: {type: 'string'}},
                source: {type: 'objectAttribute', value: {type: 'string'}, optional: true},
              },
            },
          },
          // This type doesn't have _id or title, so it should be filtered out
          {
            type: 'type',
            name: 'image',
            value: {
              type: 'object',
              attributes: {
                asset: {type: 'objectAttribute', value: {type: 'string'}},
              },
            },
          },
        ],
      })

      const {tsType, stats} = schema.evaluateProjection('{_type, title}')!

      expect(generateCode(tsType)).toMatchInlineSnapshot(`
        "ProjectionBase<{
          _type: "post";
          title: string;
        }, "post">"
      `)

      expect(stats).toMatchInlineSnapshot(`
        {
          "allTypes": 3,
          "emptyUnions": 0,
          "unknownTypes": 0,
        }
      `)
    })

    it('throws an error if an invalid projection query was provided', () => {
      const schema = new SchemaTypeGenerator({
        schemaId: 'test',
        schema: [
          {
            type: 'document',
            name: 'post',
            attributes: {
              _id: {type: 'objectAttribute', value: {type: 'string'}},
              _type: {type: 'objectAttribute', value: {type: 'string', value: 'post'}},
              title: {type: 'objectAttribute', value: {type: 'string'}},
            },
          },
        ],
      })

      // Example of an invalid projection (not an object)
      const invalidProjection = 'just-a-string'

      expect(() => schema.evaluateProjection(invalidProjection)).toThrowError(
        `Invalid projection syntax: Projections must be enclosed in curly braces, (e.g., "{_id, title}"). Received: "just-a-string"`,
      )
    })

    it('omits schema types that results in all attributes being null', () => {
      const schema = new SchemaTypeGenerator({
        schemaId: 'test',
        schema: [
          {
            type: 'document',
            name: 'post', // This should be included
            attributes: {
              _id: {type: 'objectAttribute', value: {type: 'string'}},
              _type: {type: 'objectAttribute', value: {type: 'string', value: 'post'}},
              title: {type: 'objectAttribute', value: {type: 'string'}},
              foo: {type: 'objectAttribute', value: {type: 'string'}, optional: true},
            },
          },
          {
            type: 'document',
            name: 'noFooOrTitle', // This should be omitted
            attributes: {
              _id: {type: 'objectAttribute', value: {type: 'string'}},
              _type: {type: 'objectAttribute', value: {type: 'string', value: 'noFooOrTitle'}},
              name: {type: 'objectAttribute', value: {type: 'string'}, optional: true},
            },
          },
          {
            type: 'document',
            name: 'justTitle', // This should be included
            attributes: {
              _id: {type: 'objectAttribute', value: {type: 'string'}},
              _type: {type: 'objectAttribute', value: {type: 'string', value: 'justTitle'}},
              title: {type: 'objectAttribute', value: {type: 'string'}, optional: true},
            },
          },
        ],
      })

      const {tsType, stats} = schema.evaluateProjection('{title, foo}')!

      // Only 'post' and 'justTitle' should be included
      expect(generateCode(tsType)).toMatchInlineSnapshot(`
        "ProjectionBase<{
          title: string;
          foo: string | null;
        }, "post"> | ProjectionBase<{
          title: string | null;
          foo: null;
        }, "justTitle">"
      `)

      expect(stats).toMatchInlineSnapshot(`
        {
          "allTypes": 11,
          "emptyUnions": 0,
          "unknownTypes": 0,
        }
      `)
    })

    it('returns null if all schema types result in all attributes being null', () => {
      const schema = new SchemaTypeGenerator({
        schemaId: 'test',
        schema: [
          {
            type: 'document',
            name: 'post', // This should be omitted
            attributes: {
              _type: {type: 'objectAttribute', value: {type: 'null'}},
              title: {type: 'objectAttribute', value: {type: 'null'}},
            },
          },
          {
            type: 'document',
            name: 'anotherAllNullDoc', // This should also be omitted
            attributes: {
              _type: {type: 'objectAttribute', value: {type: 'null'}},
              title: {type: 'objectAttribute', value: {type: 'null'}},
            },
          },
        ],
      })

      // All types result in nulls, so the overall result should be null
      expect(schema.evaluateProjection('{_type, title}')).toBeNull()
    })
  })

  describe('walkAndCountQueryTypeNodeStats', () => {
    it('counts unknown type', () => {
      const node: TypeNode = {type: 'unknown'}
      expect(walkAndCountQueryTypeNodeStats(node)).toEqual({
        allTypes: 1,
        unknownTypes: 1,
        emptyUnions: 0,
      })
    })

    it('counts primitive types', () => {
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

    it('counts array type', () => {
      const node: TypeNode = {type: 'array', of: {type: 'string'}}
      expect(walkAndCountQueryTypeNodeStats(node)).toEqual({
        allTypes: 2, // array + string
        unknownTypes: 0,
        emptyUnions: 0,
      })
    })

    it('counts array with unknown element type', () => {
      const node: TypeNode = {type: 'array', of: {type: 'unknown'}}
      expect(walkAndCountQueryTypeNodeStats(node)).toEqual({
        allTypes: 2, // array + unknown
        unknownTypes: 1,
        emptyUnions: 0,
      })
    })

    it('counts nested array type', () => {
      const node: TypeNode = {type: 'array', of: {type: 'array', of: {type: 'number'}}}
      expect(walkAndCountQueryTypeNodeStats(node)).toEqual({
        allTypes: 3, // outer array + inner array + number
        unknownTypes: 0,
        emptyUnions: 0,
      })
    })

    it('counts simple object type', () => {
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

    it('counts object type with multiple attributes', () => {
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

    it('counts object type with unknown rest', () => {
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

    it('counts object type with object rest', () => {
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

    it('counts object type with non-unknown/non-object rest', () => {
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

    it('counts empty union type', () => {
      const node: TypeNode = {type: 'union', of: []}
      expect(walkAndCountQueryTypeNodeStats(node)).toEqual({
        allTypes: 1, // union
        unknownTypes: 0,
        emptyUnions: 1,
      })
    })

    it('counts simple union type', () => {
      const node: TypeNode = {type: 'union', of: [{type: 'string'}, {type: 'number'}]}
      expect(walkAndCountQueryTypeNodeStats(node)).toEqual({
        allTypes: 3, // union + string + number
        unknownTypes: 0,
        emptyUnions: 0,
      })
    })

    it('counts union type with unknown member', () => {
      const node: TypeNode = {type: 'union', of: [{type: 'string'}, {type: 'unknown'}]}
      expect(walkAndCountQueryTypeNodeStats(node)).toEqual({
        allTypes: 3, // union + string + unknown
        unknownTypes: 1,
        emptyUnions: 0,
      })
    })

    it('counts complex nested type', () => {
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
