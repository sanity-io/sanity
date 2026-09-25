import {type SchemaType, type TypeNode} from 'groq-js'
import {describe, expect, it} from 'vitest'

import {inferTypeFromValue, mergeTypeNodes} from './inferTypeFromValue'
import {printTypeScript} from './printTypeScript'
import {printZod} from './printZod'
import {collectReferencedTypes, toTypeName} from './schemaTypes'

const schema: SchemaType = [
  {
    type: 'document',
    name: 'author',
    attributes: {
      _id: {type: 'objectAttribute', value: {type: 'string'}},
      _type: {type: 'objectAttribute', value: {type: 'string', value: 'author'}},
      name: {type: 'objectAttribute', value: {type: 'string'}, optional: true},
      bio: {type: 'objectAttribute', value: {type: 'inline', name: 'blockContent'}, optional: true},
    },
  },
  {
    type: 'type',
    name: 'blockContent',
    value: {
      type: 'array',
      of: {
        type: 'object',
        attributes: {
          _key: {type: 'objectAttribute', value: {type: 'string'}},
          text: {type: 'objectAttribute', value: {type: 'string'}},
        },
      },
    },
  },
  {
    type: 'type',
    name: 'chapter',
    value: {
      type: 'object',
      attributes: {
        title: {type: 'objectAttribute', value: {type: 'string'}},
        book: {type: 'objectAttribute', value: {type: 'inline', name: 'book'}},
      },
    },
  },
  {
    type: 'type',
    name: 'book',
    value: {
      type: 'object',
      attributes: {
        chapters: {
          type: 'objectAttribute',
          value: {type: 'array', of: {type: 'inline', name: 'chapter'}},
        },
      },
    },
  },
  {
    type: 'type',
    name: 'treeNode',
    value: {
      type: 'object',
      attributes: {
        label: {type: 'objectAttribute', value: {type: 'string'}},
        children: {
          type: 'objectAttribute',
          value: {type: 'array', of: {type: 'inline', name: 'treeNode'}},
          optional: true,
        },
      },
    },
  },
]

describe('inferTypeFromValue', () => {
  it('infers primitives, arrays and objects', () => {
    expect(inferTypeFromValue('x')).toEqual({type: 'string'})
    expect(inferTypeFromValue(1)).toEqual({type: 'number'})
    expect(inferTypeFromValue(true)).toEqual({type: 'boolean'})
    expect(inferTypeFromValue(null)).toEqual({type: 'null'})
    expect(inferTypeFromValue([])).toEqual({type: 'array', of: {type: 'unknown'}})
    expect(inferTypeFromValue({a: 1})).toEqual({
      type: 'object',
      attributes: {a: {type: 'objectAttribute', value: {type: 'number'}}},
    })
  })

  it('merges array items into one object per _type and marks missing attributes optional', () => {
    const node = inferTypeFromValue([
      {_type: 'post', title: 'a', tags: ['x']},
      {_type: 'post', title: null},
      {_type: 'page', slug: 's'},
    ])
    expect(node).toEqual({
      type: 'array',
      of: {
        type: 'union',
        of: [
          {
            type: 'object',
            attributes: {
              _type: {type: 'objectAttribute', value: {type: 'string', value: 'post'}},
              title: {
                type: 'objectAttribute',
                value: {type: 'union', of: [{type: 'string'}, {type: 'null'}]},
              },
              tags: {
                type: 'objectAttribute',
                value: {type: 'array', of: {type: 'string'}},
                optional: true,
              },
            },
          },
          {
            type: 'object',
            attributes: {
              _type: {type: 'objectAttribute', value: {type: 'string', value: 'page'}},
              slug: {type: 'objectAttribute', value: {type: 'string'}},
            },
          },
        ],
      },
    })
  })

  it('dedupes primitives and merges nested arrays', () => {
    expect(mergeTypeNodes([{type: 'string'}, {type: 'string'}, {type: 'null'}])).toEqual({
      type: 'union',
      of: [{type: 'string'}, {type: 'null'}],
    })
    expect(
      mergeTypeNodes([
        {type: 'array', of: {type: 'unknown'}},
        {type: 'array', of: {type: 'number'}},
      ]),
    ).toEqual({type: 'array', of: {type: 'number'}})
  })

  it('keeps a "__proto__" projection key as an ordinary attribute', () => {
    const items: unknown[] = JSON.parse('[{"__proto__": 1, "a": "x"}, {"a": "y"}]')
    const node = inferTypeFromValue(items)
    expect(node.type).toBe('array')
    const item = node.type === 'array' ? node.of : undefined
    expect(item?.type).toBe('object')
    if (item?.type !== 'object') return
    expect(Object.keys(item.attributes).sort()).toEqual(['__proto__', 'a'])
    expect(item.attributes.__proto__).toEqual({
      type: 'objectAttribute',
      value: {type: 'number'},
      optional: true,
    })
    expect(printTypeScript(node, {typeName: 'R'})).toContain('  __proto__?: number;')
    // In an object literal even a quoted `__proto__` key sets the prototype; only a computed
    // key defines the property
    expect(printZod(node, {typeName: 'R'})).toContain('  ["__proto__"]: z.number().optional(),')

    // The same key arriving through an object rest survives the merge as well
    const withRest: TypeNode = {
      type: 'object',
      attributes: {a: {type: 'objectAttribute', value: {type: 'string'}}},
      rest: {
        type: 'object',
        // An object literal would set the prototype; parsed JSON defines an own property
        attributes: JSON.parse(
          '{"__proto__": {"type": "objectAttribute", "value": {"type": "boolean"}}}',
        ),
      },
    }
    expect(printTypeScript(withRest, {typeName: 'R'})).toBe(
      'export type R = {\n  a: string;\n  __proto__: boolean;\n};',
    )
    expect(printZod(withRest, {typeName: 'R'})).toContain('  ["__proto__"]: z.boolean(),')
  })
})

describe('schemaTypes', () => {
  it('converts names to type names', () => {
    expect(toTypeName('author')).toBe('Author')
    expect(toTypeName('blockContent')).toBe('BlockContent')
    expect(toTypeName('my-type.v2')).toBe('MyTypeV2')
    expect(toTypeName('2fast')).toBe('_2fast')
    expect(toTypeName('')).toBe('Unknown')
  })

  it('collects referenced types in dependency order and detects cycles', () => {
    const node: TypeNode = {type: 'array', of: {type: 'inline', name: 'author'}}
    expect(collectReferencedTypes(node, schema)).toEqual({
      order: ['blockContent', 'author'],
      cyclic: new Set(),
    })
    expect(collectReferencedTypes({type: 'inline', name: 'treeNode'}, schema)).toEqual({
      order: ['treeNode'],
      cyclic: new Set(['treeNode']),
    })
    // Every member of a mutual cycle is cyclic, whichever one the traversal enters first
    expect(collectReferencedTypes({type: 'inline', name: 'book'}, schema)).toEqual({
      order: ['chapter', 'book'],
      cyclic: new Set(['book', 'chapter']),
    })
  })
})

describe('printTypeScript', () => {
  it('prints the result type followed by the referenced schema types', () => {
    const node: TypeNode = {
      type: 'array',
      of: {
        type: 'object',
        attributes: {
          '_id': {type: 'objectAttribute', value: {type: 'string'}},
          'name': {
            type: 'objectAttribute',
            value: {type: 'union', of: [{type: 'string'}, {type: 'null'}]},
          },
          'weird-key': {type: 'objectAttribute', value: {type: 'number', value: 1}, optional: true},
          'bio': {type: 'objectAttribute', value: {type: 'inline', name: 'blockContent'}},
        },
        rest: {type: 'unknown'},
      },
    }

    expect(printTypeScript(node, {typeName: 'AuthorsResult', schema})).toBe(
      [
        'export type AuthorsResult = Array<{',
        '  _id: string;',
        '  name: string | null;',
        '  "weird-key"?: 1;',
        '  bio: BlockContent;',
        '  [key: string]: unknown;',
        '}>;',
        '',
        'export type BlockContent = Array<{',
        '  _key: string;',
        '  text: string;',
        '}>;',
      ].join('\n'),
    )
  })

  it('prints literals, documents, intersections and empty objects', () => {
    const node: TypeNode = {
      type: 'object',
      attributes: {
        kind: {type: 'objectAttribute', value: {type: 'string', value: 'a'}},
        flag: {type: 'objectAttribute', value: {type: 'boolean', value: true}},
        author: {type: 'objectAttribute', value: {type: 'inline', name: 'author'}},
        empty: {type: 'objectAttribute', value: {type: 'object', attributes: {}}},
      },
      rest: {type: 'inline', name: 'treeNode'},
    }
    const output = printTypeScript(node, {typeName: 'Result', schema})
    expect(output).toContain('  kind: "a";')
    expect(output).toContain('  flag: true;')
    expect(output).toContain('  empty: {};')
    expect(output).toContain('} & TreeNode;')
    expect(output).toContain(
      'export type Author = {\n  _id: string;\n  _type: "author";\n  name?: string;\n  bio?: BlockContent;\n};',
    )
    expect(output).toContain(
      'export type TreeNode = {\n  label: string;\n  children?: Array<TreeNode>;\n};',
    )
  })

  it('prints unknown for references outside the schema', () => {
    expect(printTypeScript({type: 'inline', name: 'missing'}, {typeName: 'R'})).toBe(
      'export type R = Missing;\n\nexport type Missing = unknown;',
    )
  })

  it('keeps identifiers unique when schema names normalise to the same one', () => {
    const colliding: SchemaType = [
      {name: 'foo-bar', type: 'type', value: {type: 'string'}},
      {name: 'foo.bar', type: 'type', value: {type: 'number'}},
      {name: 'result', type: 'type', value: {type: 'boolean'}},
    ]
    const node: TypeNode = {
      type: 'object',
      attributes: {
        a: {type: 'objectAttribute', value: {type: 'inline', name: 'foo-bar'}},
        b: {type: 'objectAttribute', value: {type: 'inline', name: 'foo.bar'}},
        c: {type: 'objectAttribute', value: {type: 'inline', name: 'result'}},
      },
    }

    expect(printTypeScript(node, {typeName: 'Result', schema: colliding})).toBe(
      [
        'export type Result = {',
        '  a: FooBar;',
        '  b: FooBar2;',
        '  c: Result2;',
        '};',
        '',
        'export type FooBar = string;',
        '',
        'export type FooBar2 = number;',
        '',
        'export type Result2 = boolean;',
      ].join('\n'),
    )

    const zod = printZod(node, {typeName: 'Result', schema: colliding})
    expect(zod).toContain('export const FooBarSchema = z.string()')
    expect(zod).toContain('export const FooBar2Schema = z.number()')
    expect(zod).toContain('export const Result2Schema = z.boolean()')
    expect(zod).toContain('  b: FooBar2Schema,')
    expect(zod).toContain('  c: Result2Schema,')
    expect(zod).toContain('export const ResultSchema = z.object({')
  })
})

describe('printZod', () => {
  it('prints schemas for the result and its dependencies', () => {
    const node: TypeNode = {
      type: 'array',
      of: {
        type: 'object',
        attributes: {
          _id: {type: 'objectAttribute', value: {type: 'string'}},
          name: {
            type: 'objectAttribute',
            value: {type: 'union', of: [{type: 'string'}, {type: 'null'}]},
            optional: true,
          },
          kind: {
            type: 'objectAttribute',
            value: {
              type: 'union',
              of: [
                {type: 'string', value: 'a'},
                {type: 'number', value: 2},
              ],
            },
          },
          bio: {type: 'objectAttribute', value: {type: 'inline', name: 'blockContent'}},
        },
        rest: {type: 'unknown'},
      },
    }

    expect(printZod(node, {typeName: 'AuthorsResult', schema})).toBe(
      [
        `import {z} from 'zod'`,
        '',
        'export const BlockContentSchema = z.array(z.object({',
        '  _key: z.string(),',
        '  text: z.string(),',
        '}))',
        '',
        'export const AuthorsResultSchema = z.array(z.object({',
        '  _id: z.string(),',
        '  name: z.string().nullable().optional(),',
        '  kind: z.union([',
        '    z.literal("a"),',
        '    z.literal(2),',
        '  ]),',
        '  bio: BlockContentSchema,',
        '}).passthrough())',
        '',
        'export type AuthorsResult = z.infer<typeof AuthorsResultSchema>',
      ].join('\n'),
    )
  })

  it('breaks cycles with z.lazy and handles null-only unions', () => {
    const output = printZod({type: 'inline', name: 'treeNode'}, {typeName: 'Tree', schema})
    // The explicit type keeps z.infer meaningful where TypeScript cannot see through z.lazy
    expect(output).toContain(
      ['export type TreeNode = {', '  label: string;', '  children?: Array<TreeNode>;', '};'].join(
        '\n',
      ),
    )
    expect(output).toContain('export const TreeNodeSchema: z.ZodType<TreeNode> = z.object({')
    expect(output).toContain('  children: z.array(z.lazy(() => TreeNodeSchema)).optional(),')
    expect(output).toContain('export const TreeSchema = TreeNodeSchema')
    expect(output).not.toContain('ZodTypeAny')

    expect(printZod({type: 'union', of: [{type: 'null'}]}, {typeName: 'N'})).toContain(
      'export const NSchema = z.null()',
    )
  })

  it('defers every reference inside a mutual cycle so no schema is read before its declaration', () => {
    const output = printZod({type: 'inline', name: 'book'}, {typeName: 'BookResult', schema})
    const chapterIndex = output.indexOf('export const ChapterSchema')
    const bookIndex = output.indexOf('export const BookSchema')
    expect(chapterIndex).toBeGreaterThan(-1)
    expect(chapterIndex).toBeLessThan(bookIndex)
    // ChapterSchema is declared first and points forward at BookSchema, which must be lazy
    expect(output).toContain('export const ChapterSchema: z.ZodType<Chapter> = z.object({')
    expect(output).toContain('  book: z.lazy(() => BookSchema),')
    expect(output).toContain('export const BookSchema: z.ZodType<Book> = z.object({')
    // Both types are declared, so either annotation resolves whatever it mentions
    expect(output).toContain('export type Chapter = {')
    expect(output).toContain('export type Book = {')
    expect(output).toContain('  chapters: z.array(z.lazy(() => ChapterSchema)),')
    // The result schema comes after both declarations, so it references them directly
    expect(output).toContain('export const BookResultSchema = BookSchema')
  })
})
