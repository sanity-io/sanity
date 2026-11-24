import {type SchemaType, type TypeNode} from 'groq-js'
import {describe, expect, it} from 'vitest'

import {inferTypeFromValue, mergeTypeNodes} from './inferTypeFromValue'
import {toResultTypeName} from './naming'
import {printTypeScript} from './printTypeScript'
import {printZod} from './printZod'
import {collectReferencedTypes, createSchemaIdentifiers} from './schemaTypes'

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

  it('caps deeply nested values instead of overflowing the call stack', () => {
    let deep: unknown = null
    for (let index = 0; index < 5000; index++) {
      deep = {a: deep}
    }
    expect(() => inferTypeFromValue(deep)).not.toThrow()
    expect(inferTypeFromValue(deep).type).toBe('object')
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

  it('merges items that mostly carry distinct keys in one pass over their attributes', () => {
    // A keyed map per item: every key is optional, in the order it first appears, and the shared
    // one merges. Scanning every item again per distinct key would take this many items into
    // the test timeout
    const count = 30_000
    const items = Array.from({length: count}, (_, index) => ({
      id: index % 2 === 0 ? String(index) : index,
      [`key${index}`]: index,
    }))
    const node = inferTypeFromValue(items)
    expect(node.type).toBe('array')
    const item = node.type === 'array' ? node.of : undefined
    expect(item?.type).toBe('object')
    if (item?.type !== 'object') return

    const keys = Object.keys(item.attributes)
    expect(keys).toHaveLength(count + 1)
    expect(keys.slice(0, 3)).toEqual(['id', 'key0', 'key1'])
    expect(item.attributes.id).toEqual({
      type: 'objectAttribute',
      value: {type: 'union', of: [{type: 'string'}, {type: 'number'}]},
    })
    expect(item.attributes.key0).toEqual({
      type: 'objectAttribute',
      value: {type: 'number'},
      optional: true,
    })
    expect(item.attributes[`key${count - 1}`]).toEqual({
      type: 'objectAttribute',
      value: {type: 'number'},
      optional: true,
    })
  })
})

describe('schemaTypes', () => {
  it('names schema types in schema order, the way typegen does', () => {
    const identifiers = createSchemaIdentifiers([
      {name: 'author', type: 'type', value: {type: 'string'}},
      {name: 'foo-bar', type: 'type', value: {type: 'string'}},
      {name: 'foo.bar', type: 'type', value: {type: 'number'}},
      {name: '2fast', type: 'type', value: {type: 'number'}},
      {name: 'ArrayOf', type: 'type', value: {type: 'number'}},
    ])
    expect([...identifiers]).toEqual([
      ['author', 'Author'],
      ['foo-bar', 'FooBar'],
      ['foo.bar', 'FooBar_2'],
      ['2fast', '_fast'],
      ['ArrayOf', 'ArrayOf_2'],
    ])
    expect(createSchemaIdentifiers(undefined).size).toBe(0)
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
  it('prints the result type followed by the referenced schema types in schema order', () => {
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
          'author': {type: 'objectAttribute', value: {type: 'inline', name: 'author'}},
        },
      },
    }

    expect(printTypeScript(node, {typeName: 'AuthorsResult', schema})).toBe(
      [
        'export type AuthorsResult = Array<{',
        '  _id: string;',
        '  name: string | null;',
        '  "weird-key"?: 1;',
        '  author: Author;',
        '}>;',
        '',
        'export type Author = {',
        '  _id: string;',
        '  _type: "author";',
        '  name?: string;',
        '  bio?: BlockContent;',
        '};',
        '',
        'export type BlockContent = Array<{',
        '  _key: string;',
        '  text: string;',
        '}>;',
      ].join('\n'),
    )
  })

  it('prints literals, intersections, empty objects and unknown rests like typegen', () => {
    const node: TypeNode = {
      type: 'object',
      attributes: {
        kind: {type: 'objectAttribute', value: {type: 'string', value: 'a'}},
        flag: {type: 'objectAttribute', value: {type: 'boolean', value: true}},
        empty: {type: 'objectAttribute', value: {type: 'object', attributes: {}}},
        // A spread of something the schema cannot narrow makes the whole object unknown
        spread: {
          type: 'objectAttribute',
          value: {
            type: 'object',
            attributes: {a: {type: 'objectAttribute', value: {type: 'string'}}},
            rest: {type: 'unknown'},
          },
        },
      },
      rest: {type: 'inline', name: 'treeNode'},
    }
    expect(printTypeScript(node, {typeName: 'Result', schema})).toBe(
      [
        'type ArrayOf<T> = Array<T & { _key: string }>;',
        '',
        'export type Result = {',
        '  kind: "a";',
        '  flag: true;',
        '  empty: {};',
        '  spread: unknown;',
        '} & TreeNode;',
        '',
        'export type TreeNode = {',
        '  label: string;',
        '  children?: ArrayOf<TreeNode>;',
        '};',
      ].join('\n'),
    )
  })

  it('declares the helpers typegen relies on when something printed needs them', () => {
    const node: TypeNode = {
      type: 'array',
      of: {
        type: 'object',
        attributes: {
          _ref: {type: 'objectAttribute', value: {type: 'string'}},
          _type: {type: 'objectAttribute', value: {type: 'string', value: 'reference'}},
        },
        dereferencesTo: 'author',
      },
    }
    expect(printTypeScript(node, {typeName: 'Refs', schema})).toBe(
      [
        'export declare const internalGroqTypeReferenceTo: unique symbol;',
        '',
        'export type Refs = Array<{',
        '  _ref: string;',
        '  _type: "reference";',
        '  [internalGroqTypeReferenceTo]?: "author";',
        '}>;',
      ].join('\n'),
    )

    expect(printTypeScript({type: 'inline', name: 'book'}, {typeName: 'BookResult', schema})).toBe(
      [
        'type ArrayOf<T> = Array<T & { _key: string }>;',
        '',
        'export type BookResult = Book;',
        '',
        'export type Chapter = {',
        '  title: string;',
        '  book: Book;',
        '};',
        '',
        'export type Book = {',
        '  chapters: ArrayOf<Chapter>;',
        '};',
      ].join('\n'),
    )
  })

  it('splits arrays that mix named and anonymous members, as typegen does', () => {
    const node: TypeNode = {
      type: 'array',
      of: {
        type: 'union',
        of: [
          {type: 'inline', name: 'chapter'},
          {type: 'inline', name: 'treeNode'},
          {
            type: 'object',
            attributes: {_key: {type: 'objectAttribute', value: {type: 'string'}}},
            rest: {type: 'inline', name: 'author'},
          },
          {type: 'string'},
        ],
      },
    }
    expect(printTypeScript(node, {typeName: 'Mixed', schema}).split('\n\n')[1]).toBe(
      [
        'export type Mixed = Array<({',
        '  _key: string;',
        '} & Author) | string> | ArrayOf<Chapter | TreeNode>;',
      ].join('\n'),
    )
  })

  it('breaks a long union of literals onto one line per member', () => {
    const styles = ['normal', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'lead', 'small']
    const node: TypeNode = {
      type: 'object',
      attributes: {
        style: {
          type: 'objectAttribute',
          value: {type: 'union', of: styles.map((value) => ({type: 'string', value}))},
          optional: true,
        },
      },
    }
    expect(printTypeScript(node, {typeName: 'Block'})).toBe(
      [
        'export type Block = {',
        '  style?:',
        ...styles.map(
          (style, index) => `    | "${style}"${index === styles.length - 1 ? ';' : ''}`,
        ),
        '};',
      ].join('\n'),
    )
    expect(printTypeScript({type: 'array', of: node.attributes.style.value}, {typeName: 'S'})).toBe(
      ['export type S = Array<', ...styles.map((style) => `  | "${style}"`), '>;'].join('\n'),
    )
  })

  it('points out references the schema cannot resolve', () => {
    expect(printTypeScript({type: 'inline', name: 'missing'}, {typeName: 'R'})).toBe(
      'export type R = unknown /* Unable to locate the referenced type "missing" in schema */;',
    )
    expect(printZod({type: 'inline', name: 'missing'}, {typeName: 'R'}).split('\n\n')[1]).toBe(
      'export const RSchema = z.unknown() /* Unable to locate the referenced type "missing" in schema */',
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
    // A tab without a title or query gets `Result`, which the schema type already took
    const typeName = toResultTypeName('', new Set(createSchemaIdentifiers(colliding).values()))
    expect(typeName).toBe('Result_2')

    expect(printTypeScript(node, {typeName, schema: colliding})).toBe(
      [
        'export type Result_2 = {',
        '  a: FooBar;',
        '  b: FooBar_2;',
        '  c: Result;',
        '};',
        '',
        'export type FooBar = string;',
        '',
        'export type FooBar_2 = number;',
        '',
        'export type Result = boolean;',
      ].join('\n'),
    )

    const zod = printZod(node, {typeName, schema: colliding})
    expect(zod).toContain('export const FooBarSchema = z.string()')
    expect(zod).toContain('export const FooBar_2Schema = z.number()')
    expect(zod).toContain('export const ResultSchema = z.boolean()')
    expect(zod).toContain('  b: FooBar_2Schema,')
    expect(zod).toContain('  c: ResultSchema,')
    expect(zod).toContain('export const Result_2Schema = z.object({')
  })

  it('leaves the built-in Array to the arrays it prints when a schema type is named array', () => {
    // `export type Array = …` would shadow the global inside the module, and being non-generic,
    // break every `Array<T>` printed next to it (a type alias, unlike a schema constant, has no
    // suffix that keeps it apart from the built-in)
    const named: SchemaType = [
      {
        name: 'array',
        type: 'type',
        value: {
          type: 'object',
          attributes: {
            items: {
              type: 'objectAttribute',
              value: {type: 'array', of: {type: 'inline', name: 'array'}},
              optional: true,
            },
          },
        },
      },
    ]
    const node: TypeNode = {type: 'array', of: {type: 'inline', name: 'array'}}

    expect(printTypeScript(node, {typeName: 'Result', schema: named})).toBe(
      [
        'type ArrayOf<T> = Array<T & { _key: string }>;',
        '',
        'export type Result = ArrayOf<Array_2>;',
        '',
        'export type Array_2 = {',
        '  items?: ArrayOf<Array_2>;',
        '};',
      ].join('\n'),
    )

    // The recursive type makes the Zod output declare the TypeScript type as well
    const zod = printZod(node, {typeName: 'Result', schema: named})
    expect(zod).toContain('export type Array_2 = {\n  items?: ArrayOf<Array_2>;\n};')
    expect(zod).toContain('export const Array_2Schema: z.ZodType<Array_2> = z.object({')
    expect(zod).toContain('  items: arrayOf(z.lazy(() => Array_2Schema)).optional(),')
    expect(zod).toContain('export const ResultSchema = arrayOf(Array_2Schema)')
    expect(zod).not.toContain('export type Array =')
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
          status: {
            type: 'objectAttribute',
            value: {
              type: 'union',
              of: [
                {type: 'string', value: 'draft'},
                {type: 'string', value: 'published'},
              ],
            },
          },
          bio: {type: 'objectAttribute', value: {type: 'inline', name: 'blockContent'}},
          spread: {
            type: 'objectAttribute',
            value: {
              type: 'object',
              attributes: {a: {type: 'objectAttribute', value: {type: 'string'}}},
              rest: {type: 'unknown'},
            },
          },
        },
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
        '  kind: z.union([z.literal("a"), z.literal(2)]),',
        '  status: z.enum(["draft", "published"]),',
        '  bio: BlockContentSchema,',
        '  spread: z.unknown(),',
        '}))',
        '',
        'export type AuthorsResult = z.infer<typeof AuthorsResultSchema>',
      ].join('\n'),
    )
  })

  it('indents the members of a union that does not fit on one line', () => {
    const node: TypeNode = {
      type: 'object',
      attributes: {
        item: {
          type: 'objectAttribute',
          value: {
            type: 'union',
            of: [
              {
                type: 'object',
                attributes: {
                  _type: {type: 'objectAttribute', value: {type: 'string', value: 'a'}},
                },
              },
              {
                type: 'object',
                attributes: {
                  _type: {type: 'objectAttribute', value: {type: 'string', value: 'b'}},
                },
              },
            ],
          },
        },
      },
    }
    expect(printZod(node, {typeName: 'R'}).split('\n\n')[1]).toBe(
      [
        'export const RSchema = z.object({',
        '  item: z.union([',
        '    z.object({',
        '      _type: z.literal("a"),',
        '    }),',
        '    z.object({',
        '      _type: z.literal("b"),',
        '    }),',
        '  ]),',
        '})',
      ].join('\n'),
    )
  })

  it('models arrays of named types, references and intersections like the TypeScript output', () => {
    const node: TypeNode = {
      type: 'object',
      attributes: {
        author: {
          type: 'objectAttribute',
          value: {
            type: 'object',
            attributes: {
              _ref: {type: 'objectAttribute', value: {type: 'string'}},
              _weak: {type: 'objectAttribute', value: {type: 'boolean'}, optional: true},
            },
            dereferencesTo: 'author',
          },
        },
        chapters: {
          type: 'objectAttribute',
          value: {type: 'array', of: {type: 'inline', name: 'blockContent'}},
        },
        mixed: {
          type: 'objectAttribute',
          value: {
            type: 'array',
            of: {
              type: 'union',
              of: [
                {type: 'inline', name: 'blockContent'},
                {
                  type: 'object',
                  attributes: {_key: {type: 'objectAttribute', value: {type: 'string'}}},
                  rest: {type: 'inline', name: 'author'},
                },
              ],
            },
          },
        },
      },
    }
    const output = printZod(node, {typeName: 'R', schema})
    expect(output).toContain(
      [
        '/** Members of an array in a document carry a `_key` the named type does not declare */',
        'const arrayOf = <T extends z.ZodTypeAny>(member: T) =>',
        '  z.array(member.and(z.object({ _key: z.string() })))',
      ].join('\n'),
    )
    // The symbol typegen keys the reference target on is a type-level detail Zod cannot check
    expect(output).toContain(
      [
        '  author: z.object({',
        '    _ref: z.string(),',
        '    _weak: z.boolean().optional(),',
        '  }),',
        '  chapters: arrayOf(BlockContentSchema),',
        '  mixed: z.union([',
        '    z.array(z.object({',
        '      _key: z.string(),',
        '    }).and(AuthorSchema)),',
        '    arrayOf(BlockContentSchema),',
        '  ]),',
      ].join('\n'),
    )
    expect(output).not.toContain('internalGroqTypeReferenceTo')
  })

  it('breaks cycles with z.lazy and handles null-only unions', () => {
    const output = printZod({type: 'inline', name: 'treeNode'}, {typeName: 'Tree', schema})
    // The explicit type keeps z.infer meaningful where TypeScript cannot see through z.lazy
    expect(output).toContain('type ArrayOf<T> = Array<T & { _key: string }>;')
    expect(output).toContain(
      [
        'export type TreeNode = {',
        '  label: string;',
        '  children?: ArrayOf<TreeNode>;',
        '};',
      ].join('\n'),
    )
    expect(output).toContain('export const TreeNodeSchema: z.ZodType<TreeNode> = z.object({')
    expect(output).toContain('  children: arrayOf(z.lazy(() => TreeNodeSchema)).optional(),')
    expect(output).toContain('export const TreeSchema = TreeNodeSchema')

    expect(printZod({type: 'union', of: [{type: 'null'}]}, {typeName: 'N'})).toContain(
      'export const NSchema = z.null()',
    )
  })

  it('prints empty unions, which extracted schemas have, as never', () => {
    const node: TypeNode = {
      type: 'object',
      attributes: {
        listItem: {type: 'objectAttribute', value: {type: 'union', of: []}, optional: true},
        items: {type: 'objectAttribute', value: {type: 'array', of: {type: 'union', of: []}}},
      },
    }
    const typescript = printTypeScript(node, {typeName: 'Block'})
    expect(typescript).toContain('listItem?: never;')
    expect(typescript).toContain('items: Array<never>;')
    expect(printTypeScript({type: 'union', of: []}, {typeName: 'Empty'})).toBe(
      'export type Empty = never;',
    )

    const zod = printZod(node, {typeName: 'Block'})
    expect(zod).toContain('listItem: z.never().optional(),')
    expect(zod).toContain('items: z.array(z.never()),')
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
    expect(output).toContain('  chapters: arrayOf(z.lazy(() => ChapterSchema)),')
    // The result schema comes after both declarations, so it references them directly
    expect(output).toContain('export const BookResultSchema = BookSchema')
  })

  it('infers the types a recursive type mentions from their schemas instead of redeclaring them', () => {
    const author = schema[0]
    if (author.type !== 'document') throw new Error('expected the author document')
    const threaded: SchemaType = [
      {
        ...author,
        attributes: {
          ...author.attributes,
          thread: {type: 'objectAttribute', value: {type: 'inline', name: 'thread'}},
        },
      },
      ...schema.slice(1),
      {
        type: 'type',
        name: 'thread',
        value: {
          type: 'object',
          attributes: {
            author: {type: 'objectAttribute', value: {type: 'inline', name: 'author'}},
            replies: {
              type: 'objectAttribute',
              value: {type: 'array', of: {type: 'inline', name: 'thread'}},
            },
          },
        },
      },
    ]
    const output = printZod({type: 'inline', name: 'author'}, {typeName: 'R', schema: threaded})
    expect(output).toContain(
      [
        'export type Author = {',
        '  _id: string;',
        '  _type: "author";',
        '  name?: string;',
        '  bio?: z.infer<typeof BlockContentSchema>;',
        '  thread: Thread;',
        '};',
      ].join('\n'),
    )
    expect(output).not.toContain('export type BlockContent =')
  })
})
