import {describe, expect, it} from 'vitest'

import {documentTypes, schema} from '../../../../test/paramsFixtures'
import {typecheckParams} from '../../../../test/typecheck'
import {inferQueryParams} from '../paramInference'
import {printParamsTypeScript, printParamsZod, toParamsTypeName} from './printParams'

function print(query: string, values?: Record<string, unknown>) {
  const {params} = inferQueryParams(query, {schema, documentTypes, values})
  const options = {typeName: toParamsTypeName(query), schema}
  return {
    typeName: options.typeName,
    typescript: printParamsTypeScript(params, options),
    zod: printParamsZod(params, options),
  }
}

/** The property lines of the printed type or schema, without the declaration around them */
function properties(code: string): string[] {
  return code.slice(code.indexOf('{\n') + 2, code.lastIndexOf('\n}')).split('\n')
}

interface Row {
  query: string
  /** The params as they are set in the panel */
  values?: Record<string, unknown>
  typescript: string[]
  zod: string[]
}

const GEO_TYPESCRIPT = (name: string) => [
  `  ${name}: {`,
  '    lat: number;',
  '    lng: number;',
  '    alt?: number;',
  '  } | {',
  '    type: string;',
  '    coordinates: Array<unknown>;',
  '  };',
]

const GEO_ZOD = (name: string) => [
  `  ${name}: z.union([`,
  '    z.object({',
  '      lat: z.number(),',
  '      lng: z.number(),',
  '      alt: z.number().optional(),',
  '    }),',
  '    z.object({',
  '      type: z.string(),',
  '      coordinates: z.array(z.unknown()),',
  '    }),',
  '  ]),',
]

const MATRIX: Record<string, Row> = {
  'semantic similarity takes a string': {
    query:
      '*[_type == "pokemon"] | score(text::semanticSimilarity($description)) | order(_score desc)[0...10]{_id, name}',
    typescript: ['  description: string;'],
    zod: ['  description: z.string(),'],
  },
  'score, boost and match': {
    query: '*[_type == "post"] | score(boost(title match $q, 3), views > $minViews)',
    typescript: ['  q: string;', '  minViews: number;'],
    zod: ['  q: z.string(),', '  minViews: z.number(),'],
  },
  'text::query and pt::text': {
    query:
      '*[_type == "post" && [title, pt::text(body)] match text::query($search) && pt::text(body) match $q]',
    typescript: ['  search: string;', '  q: string;'],
    zod: ['  search: z.string(),', '  q: z.string(),'],
  },
  'the string functions': {
    query:
      '*[_type == "post" && string::startsWith(title, $prefix) && lower(title) != lower($exclude)]{"code": upper($code), "words": string::split(title, $separator)}',
    typescript: [
      '  prefix: string;',
      '  exclude: string;',
      '  code: string;',
      '  separator: string;',
    ],
    zod: [
      '  prefix: z.string(),',
      '  exclude: z.string(),',
      '  code: z.string(),',
      '  separator: z.string(),',
    ],
  },
  'round, math::* and comparing with numbers': {
    query:
      '*[_type == "post" && round(views, $digits) > $min]{"total": math::sum($weights), "high": math::max($values)}',
    typescript: [
      '  digits: number;',
      '  min: number;',
      '  weights: Array<number>;',
      '  values: Array<number>;',
    ],
    zod: [
      '  digits: z.number().int(),',
      '  min: z.number(),',
      '  weights: z.array(z.number()),',
      '  values: z.array(z.number()),',
    ],
  },
  'array::*, with intersects taking the type of the other array': {
    query:
      '*[_type == "post" && array::intersects(tags, $tags)]{"label": array::join($parts, $separator), "unique": array::unique($items)}',
    typescript: [
      '  tags: Array<string>;',
      '  parts: Array<string | number | boolean>;',
      '  separator: string;',
      '  items: Array<unknown>;',
    ],
    zod: [
      '  tags: z.array(z.string()),',
      '  parts: z.array(z.union([z.string(), z.number(), z.boolean()])),',
      '  separator: z.string(),',
      '  items: z.array(z.unknown()),',
    ],
  },
  'dateTime() and the system timestamps take a date and time, a datetime field a string': {
    query:
      '*[_type == "post" && dateTime(publishedAt) > dateTime($since) && _updatedAt > $updatedSince && publishedAt < $until]',
    typescript: [
      '  /** ISO 8601 date and time */',
      '  since: string;',
      '  /** ISO 8601 date and time */',
      '  updatedSince: string;',
      '  until: string;',
    ],
    zod: [
      '  /** ISO 8601 date and time */',
      '  since: z.string().datetime({offset: true}),',
      '  /** ISO 8601 date and time */',
      '  updatedSince: z.string().datetime({offset: true}),',
      '  until: z.string(),',
    ],
  },
  'geo::* takes a point or a GeoJSON geometry': {
    query:
      '*[_type == "post" && geo::distance(location, $point) < $meters && geo::contains($area, location)]',
    typescript: [...GEO_TYPESCRIPT('point'), '  meters: number;', ...GEO_TYPESCRIPT('area')],
    zod: [...GEO_ZOD('point'), '  meters: z.number(),', ...GEO_ZOD('area')],
  },
  'references() and count()': {
    query: '*[_type == "post" && references($author) && count(categories) >= $minCategories]',
    typescript: [
      '  /** Document ID, or a list of them */',
      '  author: string | Array<string>;',
      '  minCategories: number;',
    ],
    zod: [
      '  /** Document ID, or a list of them */',
      '  author: z.union([z.string(), z.array(z.string())]),',
      '  minCategories: z.number(),',
    ],
  },
  'schema fields, their listed values and membership both ways': {
    query:
      '*[_type == "post" && status == $status && _id in $ids && $tag in tags && status in $statuses]',
    typescript: [
      '  status: "draft" | "published" | "review";',
      '  /** Document IDs */',
      '  ids: Array<string>;',
      '  tag: string;',
      '  statuses: Array<"draft" | "published" | "review">;',
    ],
    zod: [
      '  status: z.enum(["draft", "published", "review"]),',
      '  /** Document IDs */',
      '  ids: z.array(z.string()),',
      '  tag: z.string(),',
      '  statuses: z.array(z.enum(["draft", "published", "review"])),',
    ],
  },
  'references and the fields of referenced documents': {
    query: '*[_type == "post" && author._ref == $author && author->name == $authorName]',
    typescript: ['  /** Document ID */', '  author: string;', '  authorName: string;'],
    zod: ['  /** Document ID */', '  author: z.string(),', '  authorName: z.string(),'],
  },
  'membership in an array of references': {
    query: '*[_type == "post" && $category in categories[]._ref]',
    typescript: ['  /** Document ID */', '  category: string;'],
    zod: ['  /** Document ID */', '  category: z.string(),'],
  },
  'the keys read from an object param': {
    query: '*[_id == $doc.id && defined($doc.slug)]',
    typescript: ['  doc: {', '    id: string;', '    slug?: unknown;', '  };'],
    zod: ['  doc: z.object({', '    id: z.string(),', '    slug: z.unknown().optional(),', '  }),'],
  },
  'document types and slice bounds': {
    query: '*[_type == $type] | order(_createdAt desc)[$start...$end]',
    typescript: [
      '  type: "author" | "category" | "pokemon" | "post";',
      '  start: number;',
      '  end: number;',
    ],
    zod: [
      '  type: z.enum(["author", "category", "pokemon", "post"]),',
      '  start: z.number().int(),',
      '  end: z.number().int(),',
    ],
  },
  'arithmetic and string concatenation': {
    query: '*[_type == "post" && views * $factor > 100]{"heading": $prefix + title}',
    typescript: ['  factor: number;', '  prefix: string;'],
    zod: ['  factor: z.number(),', '  prefix: z.string(),'],
  },
  'uses that agree intersect': {
    query: '*[_type == "post" && $mode == "draft" && $mode in ["draft", "review"]]',
    typescript: ['  mode: "draft" | "review";'],
    zod: ['  mode: z.enum(["draft", "review"]),'],
  },
  'uses that do not agree make a union': {
    query: '*[_type == "post" && ($value == views || $value == title)]',
    typescript: ['  value: number | string;'],
    zod: ['  value: z.union([z.number(), z.string()]),'],
  },
  'defined() and coalesce() allow null': {
    query:
      '*[_type == "post" && (!defined($status) || status == $status) && title == coalesce($title, "Untitled")]',
    typescript: ['  status: "draft" | "published" | "review" | null;', '  title: string | null;'],
    zod: [
      '  status: z.enum(["draft", "published", "review"]).nullable().default(null),',
      '  title: z.string().nullable().default(null),',
    ],
  },
  'a param negated before || is optional': {
    query: '*[_type == "post" && (!$status || status == $status)]',
    typescript: ['  status: "draft" | "published" | "review" | null;'],
    zod: ['  status: z.enum(["draft", "published", "review"]).nullable().default(null),'],
  },
  'conditions, dereferences and filters': {
    query:
      '*[_type == "post" && $featuredOnly]{"summary": select($short => title, pt::text(body)), "author": $authorRef->name}[$index]',
    typescript: [
      '  featuredOnly: boolean;',
      '  short: boolean;',
      '  authorRef: {',
      '    _ref: string;',
      '  };',
      '  index: number | boolean;',
    ],
    zod: [
      '  featuredOnly: z.boolean(),',
      '  short: z.boolean(),',
      '  authorRef: z.object({',
      '    _ref: z.string(),',
      '  }),',
      '  index: z.union([z.number(), z.boolean()]),',
    ],
  },
  'nested queries, in their own scope': {
    query:
      '*[_type == "post"]{title, "related": *[_type == "post" && _id != ^._id && status == ^.status && author._ref == $author]}',
    typescript: ['  /** Document ID */', '  author: string;'],
    zod: ['  /** Document ID */', '  author: z.string(),'],
  },
  'conditions on other params do not hide the documents a comparison reads': {
    query: '*[_type == "post" && count($ids) > 0 && _id in $ids && status == $status]',
    typescript: [
      '  /** Document IDs */',
      '  ids: Array<string>;',
      '  status: "draft" | "published" | "review";',
    ],
    zod: [
      '  /** Document IDs */',
      '  ids: z.array(z.string()),',
      '  status: z.enum(["draft", "published", "review"]),',
    ],
  },
  'the sanity::* functions': {
    query: '*[_type == "post" && (sanity::partOfRelease($release) || sanity::versionOf($id))]',
    typescript: ['  release: string;', '  /** Document ID */', '  id: string;'],
    zod: ['  release: z.string(),', '  /** Document ID */', '  id: z.string(),'],
  },
  'what cannot be typed says why, and the current value only types what nothing else does': {
    query:
      '*[_type == "post" && missing == $m && $a == $b && title == $title] | order($sortField){"extra": $extra, "given": $given}',
    values: {given: 'x', title: 12},
    typescript: [
      '  /** Could not be inferred because the schema does not type `missing`, which it is compared with */',
      '  m: unknown;',
      '  /** Could not be inferred because it is only compared with `$b`, which is not typed either */',
      '  a: unknown;',
      '  /** Could not be inferred because it is only compared with `$a`, which is not typed either */',
      '  b: unknown;',
      '  title: string;',
      '  /** Could not be inferred because it is only used to order by */',
      '  sortField: unknown;',
      '  /** Could not be inferred because the query only returns it */',
      '  extra: unknown;',
      '  /** Typed from its current value because the query only returns it */',
      '  given: string;',
    ],
    zod: [
      '  /** Could not be inferred because the schema does not type `missing`, which it is compared with */',
      '  m: z.unknown(),',
      '  /** Could not be inferred because it is only compared with `$b`, which is not typed either */',
      '  a: z.unknown(),',
      '  /** Could not be inferred because it is only compared with `$a`, which is not typed either */',
      '  b: z.unknown(),',
      '  title: z.string(),',
      '  /** Could not be inferred because it is only used to order by */',
      '  sortField: z.unknown(),',
      '  /** Could not be inferred because the query only returns it */',
      '  extra: z.unknown(),',
      '  /** Typed from its current value because the query only returns it */',
      '  given: z.string(),',
    ],
  },
  'a query that does not parse': {
    query: '*[_type == "post" && title == $title',
    typescript: [
      '  /** Could not be inferred because the query does not parse */',
      '  title: unknown;',
    ],
    zod: [
      '  /** Could not be inferred because the query does not parse */',
      '  title: z.unknown(),',
    ],
  },
}

const REFERENCE_QUERY =
  '*[_type == "post"]{title, "author": coalesce(author, $fallbackAuthor)->name}'

describe('printParamsTypeScript and printParamsZod', () => {
  it.each(Object.entries(MATRIX))('%s', (_, {query, values, typescript, zod}) => {
    const printed = print(query, values)
    expect(properties(printed.typescript)).toEqual(typescript)
    expect(properties(printed.zod)).toEqual(zod)
  })

  it('names the declarations after the query, and infers the type from the schema', () => {
    const {typescript, zod} = print(MATRIX['semantic similarity takes a string'].query)
    expect(typescript).toBe(
      ['export type PokemonQueryParams = {', '  description: string;', '};'].join('\n'),
    )
    expect(zod).toBe(
      [
        `import {z} from 'zod'`,
        '',
        'export const PokemonQueryParamsSchema = z.object({',
        '  description: z.string(),',
        '})',
        '',
        'export type PokemonQueryParams = z.infer<typeof PokemonQueryParamsSchema>',
      ].join('\n'),
    )
  })

  it('prints an empty object for a query without params', () => {
    const {typescript, zod} = print('*[_type == "post"]')
    expect(typescript).toBe('export type PostQueryParams = Record<string, never>;')
    expect(zod).toContain('export const PostQueryParamsSchema = z.object({})')
  })

  it('declares the schema types a param holds, without the brand a JSON value cannot carry', () => {
    const {typescript, zod} = print(REFERENCE_QUERY)
    expect(typescript).toBe(
      [
        'export type PostQueryParams = {',
        '  fallbackAuthor: AuthorReference;',
        '};',
        '',
        'export type AuthorReference = {',
        '  _ref: string;',
        '  _type: "reference";',
        '  _weak?: boolean;',
        '};',
      ].join('\n'),
    )
    expect(zod).toContain('export const AuthorReferenceSchema = z.object({')
    expect(zod).toContain('  fallbackAuthor: AuthorReferenceSchema,')
  })

  it(
    'prints modules that strict tsc accepts, whose Zod schema infers the TypeScript type',
    {timeout: 60_000},
    async () => {
      const printed = [
        ...Object.values(MATRIX).map(({query, values}) => print(query, values)),
        print('*[_type == "post"]'),
        print(REFERENCE_QUERY),
      ]
      expect(await typecheckParams(printed)).toBe('')
    },
  )
})

describe('toParamsTypeName', () => {
  it('names the params after the query, as the result type is named', () => {
    expect(toParamsTypeName('*[_type == "author"]')).toBe('AuthorQueryParams')
    expect(toParamsTypeName('')).toBe('QueryParams')
  })
})
