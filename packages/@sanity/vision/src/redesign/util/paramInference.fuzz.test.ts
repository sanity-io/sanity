import * as fc from 'fast-check'
import {evaluate, parse, type TypeNode} from 'groq-js'
import {describe, expect, it} from 'vitest'
import {z} from 'zod'

import {documentTypes, schema, STATUSES} from '../../../test/paramsFixtures'
import {importModule, type PrintedParams, typecheckParams} from '../../../test/typecheck'
import {inferQueryParams} from './paramInference'
import {printParamsTypeScript, printParamsZod, toParamsTypeName} from './typegen/printParams'

/**
 * Property tests over generated queries and datasets, after groq-content-mapper's. The seed is
 * fixed so CI is deterministic: `FUZZ_RUNS=10000` runs deeper, `FUZZ_SEED` replays a failure.
 */
function fuzzOptions<T>(runs = 100): fc.Parameters<T> {
  const deep = Number(process.env['FUZZ_RUNS'])
  const seed = Number(process.env['FUZZ_SEED'])
  return {
    numRuns: Number.isInteger(deep) && deep > 0 ? deep : runs,
    seed: Number.isInteger(seed) ? seed : 0x5a417,
  }
}

const FUZZ_TIMEOUT = process.env['FUZZ_RUNS'] ? 600_000 : 60_000

interface Doc {
  _id: string
  _type: string
  [key: string]: unknown
}

/** A field of a post, as GROQ, with how to read it from a post in a dataset */
interface Field {
  expr: string
  read: (post: Doc, dataset: Doc[]) => unknown
}

const deref = (dataset: Doc[], ref: unknown): Doc | undefined =>
  dataset.find((doc) => doc._id === (ref as {_ref?: unknown} | undefined)?._ref)

const POST_FIELDS: Field[] = [
  {expr: '_id', read: (post) => post._id},
  {expr: 'title', read: (post) => post['title']},
  {expr: 'slug.current', read: (post) => (post['slug'] as {current?: unknown})?.current},
  {expr: 'status', read: (post) => post['status']},
  {expr: 'views', read: (post) => post['views']},
  {expr: 'featured', read: (post) => post['featured']},
  {expr: 'publishedAt', read: (post) => post['publishedAt']},
  {expr: 'tags', read: (post) => post['tags']},
  {expr: 'author._ref', read: (post) => (post['author'] as {_ref?: unknown})?._ref},
  {expr: 'author->name', read: (post, dataset) => deref(dataset, post['author'])?.['name']},
]

const word = fc.constantFrom('alpha', 'beta', 'gamma', "it's", 'a"b', '')
const optional = <T>(arb: fc.Arbitrary<T>) => fc.option(arb, {nil: undefined})

const strip = (doc: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(doc).filter(([, value]) => value !== undefined)) as Doc

/** Authors, categories and posts that conform to the fixture schema */
const dataset: fc.Arbitrary<Doc[]> = fc
  .record({
    authors: fc.array(optional(word), {minLength: 1, maxLength: 3}),
    categories: fc.array(optional(word), {maxLength: 3}),
    posts: fc.array(
      fc.record({
        author: optional(fc.nat(2)),
        categories: optional(fc.array(fc.nat(2), {maxLength: 3})),
        featured: optional(fc.boolean()),
        publishedAt: optional(fc.constantFrom('2024-01-01T00:00:00Z', '2025-06-30T12:00:00Z')),
        status: optional(fc.constantFrom(...STATUSES)),
        slug: optional(word),
        tags: optional(fc.array(word, {maxLength: 3})),
        title: optional(word),
        views: optional(fc.integer({min: -5, max: 1000})),
      }),
      {minLength: 1, maxLength: 6},
    ),
  })
  .map(({authors, categories, posts}) => [
    ...authors.map((name, index) => strip({_id: `a${index}`, _type: 'author', name})),
    ...categories.map((title, index) => strip({_id: `c${index}`, _type: 'category', title})),
    ...posts.map((post, index) =>
      strip({
        ...post,
        _id: `p${index}`,
        _type: 'post',
        author:
          post.author === undefined
            ? undefined
            : {_type: 'reference', _ref: `a${post.author % authors.length}`},
        categories: post.categories?.map((category, key) => ({
          _type: 'reference',
          _key: `k${key}`,
          _ref: `c${category}`,
        })),
        slug: post.slug === undefined ? undefined : {_type: 'slug', current: post.slug},
      }),
    ),
  ])

/** A param compared with a field of a post */
interface Probe {
  field: Field
  name: string
}

/** `*[_type == "post" && <comparisons>]`, with each comparison recorded */
const probedQuery: fc.Arbitrary<{probes: Probe[]; query: string}> = fc
  .array(
    fc.record({
      field: fc.constantFrom(...POST_FIELDS),
      op: fc.constantFrom('==', '!=', '<', '>', '<=', '>='),
      paramOnLeft: fc.boolean(),
    }),
    {minLength: 1, maxLength: 4},
  )
  .chain((comparisons) =>
    fc
      .tuple(
        fc.constantFrom('&&', '||'),
        fc.constantFrom('', '{title, views}', '[0]', '| order(views desc)', '[0...2]'),
      )
      .map(([join, tail]) => {
        const probes = comparisons.map((comparison, index) => ({...comparison, name: `p${index}`}))
        const filter = probes
          .map(({field, name, op, paramOnLeft}) =>
            paramOnLeft ? `$${name} ${op} ${field.expr}` : `${field.expr} ${op} $${name}`,
          )
          .join(` ${join} `)
        return {probes, query: `*[_type == "post" && (${filter})]${tail}`}
      }),
  )

/** A query from a small grammar over the fixture schema, valid or not */
const groqQuery: fc.Arbitrary<string> = fc.letrec<{
  cond: string
  projection: string
  query: string
  value: string
}>((tie) => ({
  cond: fc.oneof(
    {depthSize: 'small', withCrossShrink: true},
    fc.constantFrom(
      '_type == "post"',
      'defined(title)',
      'views > $min',
      '$tag in tags',
      '_id in $ids',
      'title match $q',
      'author->name == $name',
      'views in $low..$high',
      '^.title == $parent',
      'slug.current == $slug',
      'status == $status',
      '(!defined($status) || status == $status)',
      '@ == $x',
      '$a == $b',
      'references($id)',
      'count(categories) > $n',
      'count($ids) > 0',
      'string::startsWith(title, $prefix)',
      'array::intersects(tags, $tags)',
      'pt::text(body) match $search',
      'dateTime(publishedAt) > dateTime($since)',
      'round(views, $digits) > 1',
      'geo::distance(location, $point) < $meters',
      'featured',
      'true',
      'null',
    ),
    fc
      .tuple(tie('cond'), fc.constantFrom('&&', '||'), tie('cond'))
      .map(([a, op, b]) => `${a} ${op} ${b}`),
    tie('cond').map((cond) => `!(${cond})`),
    tie('cond').map((cond) => `(${cond})`),
  ),
  projection: fc.oneof(
    {depthSize: 'small'},
    fc.constantFrom(
      '{title}',
      '{...}',
      '{_id, "n": author->name}',
      '{"s": slug.current, "c": categories[]->title}',
      '{"p": $p}',
      '{"t": coalesce(title, $fallback)}',
      '{"u": upper($code), "j": array::join(tags, $separator)}',
    ),
    tie('value').map((value) => `{"v": ${value}}`),
    fc
      .tuple(tie('cond'), tie('value'))
      .map(([cond, value]) => `{title, ${cond} => {"v": ${value}}}`),
    fc
      .tuple(tie('cond'), tie('projection'))
      .map(([cond, inner]) => `{"a": author->${inner}, "w": select(${cond} => 1, 2)}`),
  ),
  query: fc.oneof(
    {depthSize: 'small'},
    fc.constant('*'),
    fc.constantFrom('*[_type == "post"]', '*[_type == "author"]', '*[_type == $type]'),
    fc.tuple(tie('query'), tie('cond')).map(([base, cond]) => `${base}[${cond}]`),
    fc.tuple(tie('query'), tie('projection')).map(([base, projection]) => `${base}${projection}`),
    fc
      .tuple(tie('query'), fc.constantFrom('[0]', '[0..2]', '[$start...$end]', '[1...$end]'))
      .map(([base, slice]) => `${base}${slice}`),
    fc
      .tuple(
        tie('query'),
        fc.constantFrom(
          '| order(views desc)',
          '| order(title asc, _id)',
          '| score(title match $q)',
          '| score(boost(views > $v, 2))',
          '| score(text::semanticSimilarity($description))',
        ),
      )
      .map(([base, pipe]) => `${base} ${pipe}`),
    tie('query').map((base) => `count(${base})`),
    fc.tuple(tie('query'), tie('query')).map(([a, b]) => `{"a": ${a}, "b": ${b}}`),
    tie('query').map((base) => `${base}[]->`),
  ),
  value: fc.oneof(
    {depthSize: 'small'},
    fc.constantFrom(
      'title',
      'views',
      '$p',
      '"x"',
      '1',
      'null',
      '^.title',
      '@',
      'tags[0]',
      'author->',
      'categories[]->title',
    ),
    fc.tuple(tie('value'), tie('value')).map(([a, b]) => `coalesce(${a}, ${b})`),
    fc
      .tuple(tie('cond'), tie('value'), tie('value'))
      .map(([cond, a, b]) => `select(${cond} => ${a}, ${b})`),
    tie('query'),
  ),
})).query

/** A query from the grammar with random characters spliced in, to reach the error paths */
const mangledQuery: fc.Arbitrary<string> = fc
  .tuple(groqQuery, fc.nat(), fc.nat(3), fc.string({maxLength: 3, unit: 'binary'}))
  .map(([query, at, remove, insert]) => {
    const index = at % (query.length + 1)
    return query.slice(0, index) + insert + query.slice(index + remove)
  })

/** Params as they are set in the panel, for the params the grammar only returns */
const values = fc.option(
  fc.dictionary(
    fc.constantFrom('p', 'x', 'fallback', 'a', 'b', 'code'),
    fc.jsonValue({maxDepth: 2}),
  ),
  {nil: undefined},
)

/** Whether a JSON value is one that `type` describes */
function conforms(value: unknown, node: TypeNode): boolean {
  switch (node.type) {
    case 'unknown':
      return true
    case 'null':
      return value === null
    case 'boolean':
    case 'number':
    case 'string':
      return typeof value === node.type && (node.value === undefined || value === node.value)
    case 'array':
      return Array.isArray(value) && value.every((item) => conforms(item, node.of))
    case 'union':
      return node.of.some((member) => conforms(value, member))
    case 'object': {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
      const record = value as Record<string, unknown>
      return Object.entries(node.attributes).every(([name, attribute]) =>
        name in record ? conforms(record[name], attribute.value) : attribute.optional === true,
      )
    }
    case 'inline':
      return false
    default:
      node satisfies never
      return false
  }
}

function print(query: string, currentValues?: Record<string, unknown>): PrintedParams {
  const {params} = inferQueryParams(query, {schema, documentTypes, values: currentValues})
  const options = {typeName: toParamsTypeName(query), schema}
  return {
    typeName: options.typeName,
    typescript: printParamsTypeScript(params, options),
    zod: printParamsZod(params, options),
  }
}

/** The params schema of a printed Zod module, loaded the way an app loads it */
async function importParamsSchema({typeName, zod}: PrintedParams): Promise<z.ZodType> {
  const paramsSchema = (await importModule(zod))[`${typeName}Schema`]
  if (!(paramsSchema instanceof z.ZodType)) throw new Error(`${typeName}Schema is not a Zod schema`)
  return paramsSchema
}

describe('inferQueryParams, fuzzed', () => {
  it(
    'types a param compared with a field so that every value of the field has the type',
    {timeout: FUZZ_TIMEOUT},
    async () => {
      await fc.assert(
        fc.asyncProperty(probedQuery, dataset, async ({probes, query}, docs) => {
          const inference = inferQueryParams(query, {schema, documentTypes})
          expect(inference.syntaxError, query).toBe(false)
          const runs: Record<string, unknown>[] = []
          const complete: Record<string, unknown>[] = []
          for (const post of docs.filter((doc) => doc._type === 'post')) {
            const params: Record<string, unknown> = {}
            runs.push(params)
            if (probes.every(({field}) => field.read(post, docs) !== undefined)) {
              complete.push(params)
            }
            for (const {field, name} of probes) {
              const value = field.read(post, docs)
              params[name] = value ?? null
              if (value === undefined) continue
              const param = inference.params.find((each) => each.name === name)
              expect(param, `${name} in ${query}`).toBeDefined()
              expect(
                conforms(value, param!.node),
                `${JSON.stringify(value)} for $${name} in ${query}: ${JSON.stringify(param!.node)}`,
              ).toBe(true)
            }
          }
          // The API takes the same values
          await Promise.all(
            runs.map(async (params) =>
              (await evaluate(parse(query, {params}), {dataset: docs, params})).get(),
            ),
          )
          // And so does the exported Zod schema, for the runs that set every param
          const paramsSchema = await importParamsSchema(print(query))
          for (const params of complete) {
            const {error} = paramsSchema.safeParse(params)
            expect(error?.message, `${JSON.stringify(params)} for ${query}`).toBeUndefined()
          }
        }),
        fuzzOptions(),
      )
    },
  )

  it('names every param of a query once, whether it parses or not', () => {
    fc.assert(
      fc.property(fc.oneof(groqQuery, mangledQuery), (query) => {
        const names = inferQueryParams(query, {schema, documentTypes}).params.map(({name}) => name)
        const placeholders = query.includes('"') ? undefined : query.matchAll(/\$(\w+)/g)
        if (placeholders) {
          expect(names, query).toEqual([...new Set([...placeholders].map((match) => match[1]))])
        }
        expect(new Set(names).size, query).toBe(names.length)
      }),
      fuzzOptions(300),
    )
  })
})

describe('printParamsTypeScript and printParamsZod, fuzzed', () => {
  it(
    'print the same modules every time, which strict tsc accepts, whose types agree and which load',
    {timeout: FUZZ_TIMEOUT},
    async () => {
      const queries: string[] = []
      const printed: PrintedParams[] = []
      fc.assert(
        fc.property(fc.oneof(groqQuery, mangledQuery), values, (query, currentValues) => {
          const first = print(query, currentValues)
          expect(print(query, currentValues), query).toEqual(first)
          queries.push(query)
          printed.push(first)
        }),
        fuzzOptions(200),
      )
      const diagnostics = await typecheckParams(printed)
      const failed = [...new Set([...diagnostics.matchAll(/\bm(\d+)\./g)].map((match) => match[1]))]
      expect(
        diagnostics,
        failed.map((index) => JSON.stringify(queries[Number(index)])).join('\n'),
      ).toBe('')
      const loaded = await Promise.allSettled(printed.map(importParamsSchema))
      const unloadable = loaded.flatMap((result, index) =>
        result.status === 'rejected'
          ? [`${JSON.stringify(queries[index])}: ${String(result.reason)}`]
          : [],
      )
      expect(unloadable).toEqual([])
    },
  )
})
