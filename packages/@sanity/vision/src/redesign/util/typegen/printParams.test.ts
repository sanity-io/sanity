import {Schema} from '@sanity/schema'
import {extractSchema} from '@sanity/schema/_internal'
import {describe, expect, it} from 'vitest'

import {inferQueryParams} from '../paramInference'
import {printParamsTypeScript, printParamsZod, toParamsTypeName} from './printParams'

const schema = extractSchema(
  Schema.compile({
    name: 'test',
    types: [
      {name: 'slug', type: 'object', fields: [{name: 'current', type: 'string'}]},
      {
        name: 'post',
        type: 'document',
        fields: [
          {name: 'title', type: 'string'},
          {name: 'slug', type: 'slug'},
          {name: 'status', type: 'string', options: {list: ['draft', 'review', 'published']}},
          {
            name: 'category',
            type: 'string',
            options: {
              list: ['announcements', 'engineering', 'product-updates', 'customer-stories'],
            },
          },
          {name: 'rating', type: 'number'},
          {name: 'featured', type: 'boolean'},
          {name: 'publishedAt', type: 'datetime'},
          {name: 'tags', type: 'array', of: [{type: 'string'}]},
          {name: 'author', type: 'reference', to: [{type: 'author'}]},
        ],
      },
      {name: 'author', type: 'document', fields: [{name: 'name', type: 'string'}]},
    ],
  }),
)

const documentTypes = ['author', 'post']

function print(query: string, withSchema = true) {
  const {params} = inferQueryParams(query, withSchema ? {schema, documentTypes} : {documentTypes})
  const typeName = toParamsTypeName(query)
  return {
    typescript: printParamsTypeScript(params, typeName),
    zod: printParamsZod(params, typeName),
  }
}

/** The property lines of the printed type or schema, without the declaration around them */
function properties(code: string): string {
  const start = code.indexOf('{\n') + 2
  const end = code.lastIndexOf('\n}')
  return code.slice(start, end)
}

describe('toParamsTypeName', () => {
  it('names the params after the query, as the result type is named', () => {
    expect(toParamsTypeName('*[_type == "author"]')).toBe('AuthorQueryParams')
    expect(toParamsTypeName('')).toBe('QueryParams')
  })
})

describe('printParamsTypeScript and printParamsZod', () => {
  it('prints strings, numbers, booleans and whole numbers', () => {
    const {typescript, zod} = print(
      '*[_type == "post" && title match $search && rating >= $minRating && featured == $featured][0...$limit]',
    )
    expect(typescript).toBe(
      [
        'export type PostQueryParams = {',
        '  search: string;',
        '  minRating: number;',
        '  featured: boolean;',
        '  limit: number;',
        '};',
      ].join('\n'),
    )
    expect(zod).toBe(
      [
        `import {z} from 'zod'`,
        '',
        'export const PostQueryParamsSchema = z.object({',
        '  search: z.string(),',
        '  minRating: z.number(),',
        '  featured: z.boolean(),',
        '  limit: z.number().int(),',
        '})',
        '',
        'export type PostQueryParams = z.infer<typeof PostQueryParamsSchema>',
      ].join('\n'),
    )
  })

  it('prints the values a param is compared with as a literal union', () => {
    const {typescript, zod} = print('*[_type == "post" && status == $status]')
    expect(properties(typescript)).toBe('  status: "draft" | "published" | "review";')
    expect(properties(zod)).toBe('  status: z.enum(["draft", "published", "review"]),')
  })

  it('prints document types for _type, with or without the schema', () => {
    expect(properties(print('*[_type == $type]').typescript)).toBe('  type: "author" | "post";')
    expect(properties(print('*[_type == $type]', false).zod)).toBe(
      '  type: z.enum(["author", "post"]),',
    )
  })

  it('prints a single allowed value as a literal', () => {
    const {params} = inferQueryParams('*[_type == $type]', {documentTypes: ['post']})
    expect(properties(printParamsTypeScript(params, 'P'))).toBe('  type: "post";')
    expect(properties(printParamsZod(params, 'P'))).toBe('  type: z.literal("post"),')
  })

  it('prints arrays for params on the right of `in`, and elements for the left', () => {
    const {typescript, zod} = print(
      '*[_type in $types && status in $statuses && $tag in tags[] && _id in $ids]',
    )
    expect(properties(typescript)).toBe(
      [
        '  types: Array<"author" | "post">;',
        '  statuses: Array<"draft" | "published" | "review">;',
        '  tag: string;',
        '  /** Document ID */',
        '  ids: Array<string>;',
      ].join('\n'),
    )
    expect(properties(zod)).toBe(
      [
        '  types: z.array(z.enum(["author", "post"])),',
        '  statuses: z.array(z.enum(["draft", "published", "review"])),',
        '  tag: z.string(),',
        '  /** Document ID */',
        '  ids: z.array(z.string()),',
      ].join('\n'),
    )
  })

  it('marks document IDs and datetimes', () => {
    const {typescript, zod} = print(
      '*[references($authorId) && _updatedAt > $since && publishedAt < $until]',
    )
    expect(properties(typescript)).toBe(
      [
        '  /** Document ID */',
        '  authorId: string;',
        '  /** ISO 8601 date and time */',
        '  since: string;',
        '  until: string;',
      ].join('\n'),
    )
    expect(properties(zod)).toBe(
      [
        '  /** Document ID */',
        '  authorId: z.string(),',
        '  /** ISO 8601 date and time */',
        '  since: z.string().datetime({offset: true}),',
        '  until: z.string(),',
      ].join('\n'),
    )
  })

  it('falls back to unknown, with a comment, when a param cannot be typed', () => {
    const {typescript, zod} = print('*[_type == "post"]{title, "extra": $extra}')
    expect(properties(typescript)).toBe(
      ['  /** Could not be inferred from the query */', '  extra: unknown;'].join('\n'),
    )
    expect(properties(zod)).toBe(
      ['  /** Could not be inferred from the query */', '  extra: z.unknown(),'].join('\n'),
    )
  })

  it('types the params of a query that does not parse as unknown', () => {
    const {typescript} = print('*[_type == $type && title == $title')
    expect(properties(typescript)).toBe(
      [
        '  /** Could not be inferred from the query */',
        '  type: unknown;',
        '  /** Could not be inferred from the query */',
        '  title: unknown;',
      ].join('\n'),
    )
  })

  it('allows null where the query handles a missing value, and keeps every key required', () => {
    const {typescript, zod} = print(
      '*[_type == "post" && (!defined($status) || status == $status) && ($category == null || category == $category) && title == coalesce($title, "Untitled")]',
    )
    expect(properties(typescript)).toBe(
      [
        '  status: "draft" | "published" | "review" | null;',
        '  category:',
        '    | "announcements"',
        '    | "customer-stories"',
        '    | "engineering"',
        '    | "product-updates"',
        '    | null;',
        '  title: string | null;',
      ].join('\n'),
    )
    expect(properties(zod)).toBe(
      [
        '  status: z.enum(["draft", "published", "review"]).nullable(),',
        '  category: z.enum([',
        '    "announcements",',
        '    "customer-stories",',
        '    "engineering",',
        '    "product-updates",',
        '  ]).nullable(),',
        '  title: z.string().nullable(),',
      ].join('\n'),
    )
  })

  it('keeps the final coalesce fallback required', () => {
    const {typescript, zod} = print(
      '*[_type == "post"]{"label": coalesce($label, title, $fallback)}',
    )
    expect(properties(typescript)).toBe(
      ['  label: string | null;', '  fallback: string;'].join('\n'),
    )
    expect(properties(zod)).toBe(
      ['  label: z.string().nullable(),', '  fallback: z.string(),'].join('\n'),
    )
  })

  it('breaks long array unions over lines', () => {
    const {typescript, zod} = print('*[_type == "post" && category in $categories]')
    expect(properties(typescript)).toBe(
      [
        '  categories: Array<',
        '    | "announcements"',
        '    | "customer-stories"',
        '    | "engineering"',
        '    | "product-updates"',
        '  >;',
      ].join('\n'),
    )
    expect(properties(zod)).toBe(
      [
        '  categories: z.array(',
        '    z.enum([',
        '      "announcements",',
        '      "customer-stories",',
        '      "engineering",',
        '      "product-updates",',
        '    ]),',
        '  ),',
      ].join('\n'),
    )
  })

  it('types params of nested queries and merges repeated usages', () => {
    const {typescript} = print(
      '*[_type == "post" && _id == $id]{title, "related": *[_type == "post" && _id != $id && status == $status]}',
    )
    expect(properties(typescript)).toBe(
      ['  /** Document ID */', '  id: string;', '  status: "draft" | "published" | "review";'].join(
        '\n',
      ),
    )
  })

  it('prints an empty object for a query without params', () => {
    const {typescript, zod} = print('*[_type == "post"]')
    expect(typescript).toBe('export type PostQueryParams = Record<string, never>;')
    expect(zod).toContain('export const PostQueryParamsSchema = z.object({})')
  })
})
