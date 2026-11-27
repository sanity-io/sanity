import {Schema} from '@sanity/schema'
import {defineArrayMember, defineField, defineType} from 'sanity'
import {createSchema} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'
import {describe, expect, it} from 'vitest'

import {evaluateQueryType} from './evaluateQueryType'
import {toQueryVariableName, toResultTypeName} from './naming'
import {printTypeScript} from './printTypeScript'
import {printZod} from './printZod'
import {createSchemaIdentifiers} from './schemaTypes'

const schema = Schema.compile({
  name: 'test',
  types: [
    {
      name: 'author',
      type: 'document',
      fields: [
        {name: 'name', type: 'string'},
        {name: 'age', type: 'number'},
      ],
    },
  ],
})

describe('evaluateQueryType', () => {
  it('evaluates against the workspace schema like typegen', () => {
    const evaluation = evaluateQueryType({
      query: '*[_type == "author"]{_id, name}',
      params: {},
      schema,
      hasResult: false,
      result: undefined,
    })
    expect(evaluation.source).toBe('schema')
    if (evaluation.source !== 'schema') throw new Error('expected schema evaluation')
    expect(printTypeScript(evaluation.node, {typeName: 'Authors', schema: evaluation.schema})).toBe(
      ['export type Authors = Array<{', '  _id: string;', '  name: string | null;', '}>;'].join(
        '\n',
      ),
    )
  })

  it('falls back to the result when the query cannot be evaluated', () => {
    const evaluation = evaluateQueryType({
      query: '*[_type == "author" && _id == $id]{name',
      params: {},
      schema,
      hasResult: true,
      result: [{name: 'x'}],
    })
    expect(evaluation.source).toBe('result')
    if (evaluation.source !== 'result') throw new Error('expected result inference')
    expect(evaluation.schemaError).toBeInstanceOf(Error)
    expect(evaluation.node).toEqual({
      type: 'array',
      of: {type: 'object', attributes: {name: {type: 'objectAttribute', value: {type: 'string'}}}},
    })
  })

  it('reports when there is nothing to derive a type from', () => {
    const evaluation = evaluateQueryType({
      query: '',
      params: {},
      schema: undefined,
      hasResult: false,
      result: undefined,
    })
    expect(evaluation).toEqual({source: 'none', schemaError: undefined})
  })

  it('reports why the schema could not be used when the query evaluates to an unknown type', () => {
    const evaluation = evaluateQueryType({
      query: 'global::identity()',
      params: {},
      schema,
      hasResult: true,
      result: 'me',
    })
    expect(evaluation.source).toBe('result')
    if (evaluation.source !== 'result') throw new Error('expected result inference')
    expect(evaluation.schemaError?.message).toBe(
      'it evaluates to an unknown type, which the schema cannot narrow',
    )
  })
})

describe('evaluateQueryType with recursive schemas', () => {
  // A document type that embeds itself as a field and as an array member, directly and through
  // another document type, the way the test studio's recursive types do. Before the schema
  // extraction learnt to hoist the embedded form, this overflowed the call stack.
  const recursive = createSchema({
    name: 'test',
    types: [
      defineType({
        name: 'node',
        type: 'document',
        fields: [
          defineField({name: 'title', type: 'string'}),
          defineField({name: 'parent', type: 'node'}),
          defineField({
            name: 'children',
            type: 'array',
            of: [defineArrayMember({type: 'node'}), defineArrayMember({type: 'leaf'})],
          }),
          defineField({name: 'body', type: 'blockContent'}),
        ],
      }),
      defineType({
        name: 'leaf',
        type: 'document',
        fields: [
          defineField({name: 'label', type: 'string'}),
          defineField({name: 'tree', type: 'node'}),
          defineField({name: 'owner', type: 'reference', to: [{type: 'node'}]}),
        ],
      }),
      defineType({
        name: 'blockContent',
        type: 'array',
        of: [
          defineArrayMember({
            type: 'block',
            of: [defineArrayMember({type: 'node'})],
            marks: {
              annotations: [
                defineArrayMember({
                  name: 'link',
                  type: 'object',
                  fields: [defineField({name: 'href', type: 'url'})],
                }),
              ],
            },
          }),
        ],
      }),
    ],
  })

  function evaluate(query: string) {
    const evaluation = evaluateQueryType({
      query,
      params: {},
      schema: recursive,
      hasResult: false,
      result: undefined,
    })
    if (evaluation.source !== 'schema') {
      throw (
        evaluation.schemaError ?? new Error(`expected schema evaluation, got ${evaluation.source}`)
      )
    }
    const typeName = toResultTypeName(
      toQueryVariableName(query),
      new Set(createSchemaIdentifiers(evaluation.schema).values()),
    )
    return {
      typescript: printTypeScript(evaluation.node, {typeName, schema: evaluation.schema}),
      zod: printZod(evaluation.node, {typeName, schema: evaluation.schema}),
    }
  }

  it('evaluates a query for a document type that embeds itself', () => {
    const {typescript, zod} = evaluate('*[_type == "node"]')
    expect(typescript).toContain(
      [
        'export declare const internalGroqTypeReferenceTo: unique symbol;',
        '',
        'export type NodeQueryResult = Array<{',
        '  _id: string;',
        '  _type: "node";',
        '  _createdAt: string;',
        '  _updatedAt: string;',
        '  _rev: string;',
        '  title?: string;',
        '  parent?: NodeInline;',
        // The embedded leaf is spelled out, since it only recurses through the node it is in
        '  children?: Array<({',
        '    _key: string;',
        '  } & NodeInline) | {',
        '    label?: string;',
        '    tree?: NodeInline;',
        '    owner?: NodeReference;',
        '    _type: "leaf";',
        '    _key: string;',
        '  }>;',
        '  body?: BlockContent;',
        '}>;',
        '',
        'export type NodeReference = {',
        '  _ref: string;',
        '  _type: "reference";',
        '  _weak?: boolean;',
        '  [internalGroqTypeReferenceTo]?: "node";',
        '};',
      ].join('\n'),
    )
    // The embedded form of the document carries its `_type` and fields, not the system fields
    expect(typescript).toContain(
      [
        'export type NodeInline = {',
        '  _type: "node";',
        '  title?: string;',
        '  parent?: NodeInline;',
        '  children?: Array<({',
      ].join('\n'),
    )
    expect(typescript).not.toContain('export type LeafInline')

    expect(zod).toContain('export const NodeInlineSchema: z.ZodType<NodeInline> = z.object({')
    expect(zod).toContain('  parent: z.lazy(() => NodeInlineSchema).optional(),')
    expect(zod).toContain('      tree: z.lazy(() => NodeInlineSchema).optional(),')
    expect(zod).toContain('export const NodeQueryResultSchema = z.array(z.object({')
    expect(zod).toContain('  parent: NodeInlineSchema.optional(),')
    expect(zod).toContain('export type NodeQueryResult = z.infer<typeof NodeQueryResultSchema>')
  })

  it('evaluates projections that follow references into the recursive type', () => {
    const {typescript, zod} = evaluate('*[_type == "leaf"]{label, owner->{title, parent}}')
    expect(typescript).toContain(
      [
        'export type LeafQueryResult = Array<{',
        '  label: string | null;',
        '  owner: {',
        '    title: string | null;',
        '    parent: NodeInline | null;',
        '  } | null;',
        '}>;',
      ].join('\n'),
    )
    expect(zod).toContain(
      [
        'export const LeafQueryResultSchema = z.array(z.object({',
        '  label: z.string().nullable(),',
        '  owner: z.object({',
        '    title: z.string().nullable(),',
        '    parent: NodeInlineSchema.nullable(),',
        '  }).nullable(),',
        '}))',
      ].join('\n'),
    )
  })

  it('evaluates Portable Text that embeds the recursive type as an inline block', () => {
    const {typescript} = evaluate('*[_type == "node"][0].body')
    expect(typescript).toContain('export type NodeQueryResult = BlockContent | null;')
    expect(typescript).toContain('export type BlockContent = Array<{')
    // The inline block of the recursive document is spelled out, with the recursion inside it
    // going through the hoisted type
    expect(typescript).toContain(
      [
        '  children?: Array<{',
        '    marks?: Array<string>;',
        '    text?: string;',
        '    _type: "span";',
        '    _key: string;',
        '  } | {',
        '    title?: string;',
        '    parent?: NodeInline;',
      ].join('\n'),
    )
    expect(typescript).toContain('  markDefs?: Array<{')
    expect(typescript).toContain(
      '  style?: "normal" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "blockquote";',
    )
  })
})
