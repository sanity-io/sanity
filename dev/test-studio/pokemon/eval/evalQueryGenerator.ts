#!/usr/bin/env tsx
/**
 * Runs Vision's AI query generator against the `pokedex` dataset and grades what it writes.
 * See `../README.md` for how to run it.
 */
import {parseArgs} from 'node:util'

import {createClient, type SanityClient} from '@sanity/client'
import {type Schema, createSchema} from 'sanity'

import {describeDocumentListFields} from '../../../../packages/@sanity/vision/src/redesign/util/documentListFields'
import {resetDatasetEmbeddings} from '../../../../packages/@sanity/vision/src/redesign/util/embeddings'
import {
  editQuery,
  generateQuery,
  type GeneratedQuery,
  type GenerateQueryClient,
} from '../../../../packages/@sanity/vision/src/redesign/util/generateQuery'
import {
  getRequestedDocumentTypes,
  summarizeSchema,
} from '../../../../packages/@sanity/vision/src/redesign/util/schemaSummary'
import {pokemonSchemaTypes} from '../schema'

const {values: args} = parseArgs({
  options: {
    'project-id': {type: 'string', default: 'ppsg7ml5'},
    'dataset': {type: 'string', default: 'pokedex'},
    'api-version': {type: 'string', default: 'v2025-02-19'},
    'runs': {type: 'string', default: '3'},
    'only': {type: 'string'},
  },
})

const RUNS = Number(args.runs)
const SEMANTIC = /text::semanticSimilarity\s*\(/

interface Grade {
  pass: boolean
  note: string
}

interface Case {
  id: string
  request: string
  /** Edit cases start from this query */
  edit?: {query: string; params?: Record<string, unknown>}
  /** Pretends the dataset has no embeddings, as most datasets do not */
  withoutEmbeddings?: boolean
  grade: GradeQuery
}

type GradeQuery = (attempt: GeneratedQuery, result: unknown, truth: Truth) => Grade | Promise<Grade>

type Truth = (query: string) => Promise<unknown>

const ids = (result: unknown): string[] =>
  Array.isArray(result)
    ? result.map((item) => (typeof item === 'object' && item && '_id' in item ? item._id : item))
    : []

const sameSet = (actual: unknown[], expected: unknown[]) =>
  actual.length === expected.length && expected.every((value) => actual.includes(value))

const names = (result: unknown) =>
  (Array.isArray(result) ? result : [])
    .slice(0, 3)
    .map((item) => {
      const row = typeof item === 'object' && item ? (item as Record<string, unknown>) : {}
      return String(row.title ?? row.name ?? '?')
    })
    .join(', ')

function semanticGrade(attempt: GeneratedQuery, result: unknown): Grade {
  const {query} = attempt
  if (!/score\([^|]*text::semanticSimilarity/.test(query)) {
    return {pass: false, note: 'does not rank with semanticSimilarity in score()'}
  }
  if (!/order\(\s*_score\s+desc/.test(query)) return {pass: false, note: 'not ordered by _score'}
  if (!Array.isArray(result) || result.length === 0) return {pass: false, note: 'no results'}
  return {pass: true, note: `top: ${names(result)}`}
}

function notSemantic(grade: GradeQuery) {
  return async (attempt: GeneratedQuery, result: unknown, truth: Truth): Promise<Grade> =>
    SEMANTIC.test(attempt.query)
      ? {pass: false, note: 'used semantic search for an exact request'}
      : grade(attempt, result, truth)
}

async function matchesIds(result: unknown, truth: Truth, expected: string, ordered = false) {
  const want = (await truth(expected)) as string[]
  const got = ids(result)
  const pass = ordered ? JSON.stringify(got) === JSON.stringify(want) : sameSet(got, want)
  return {
    pass,
    note: `${got.length} of ${want.length} expected documents${pass ? '' : ' (wrong set)'}`,
  }
}

const GRANDPA =
  'grandpa he does not know the diff between digimon and pokenobn what pokemon is he talking about???'

const CASES: Case[] = [
  {id: 'semantic: vague description', request: GRANDPA, grade: semanticGrade},
  {
    id: 'semantic: same request, no embeddings',
    request: GRANDPA,
    withoutEmbeddings: true,
    grade: (attempt, result) =>
      SEMANTIC.test(attempt.query)
        ? {pass: false, note: 'used semanticSimilarity on a dataset without embeddings'}
        : {pass: Array.isArray(result) && result.length > 0, note: `top: ${names(result)}`},
  },
  {
    id: 'exact: one by name',
    request: 'show me pikachu',
    grade: notSemantic(async (_, result) => {
      const got = ids(result)
      const pass =
        got[0] === 'pokemon_species_pikachu' ||
        (result as {_id?: string})?._id === 'pokemon_species_pikachu'
      return {pass, note: pass ? 'Pikachu' : `got ${JSON.stringify(got.slice(0, 3))}`}
    }),
  },
  {
    id: 'exact: type and generation',
    request: 'fire type pokemon from generation 1',
    grade: notSemantic((_, result, truth) =>
      matchesIds(
        result,
        truth,
        '*[_type == "pokemon" && "Fire" in types[]->name && generation->number == 1]._id',
      ),
    ),
  },
  {
    id: 'exact: count',
    request: 'how many pokemon are there?',
    grade: notSemantic(async (_, result, truth) => {
      const want = await truth('count(*[_type == "pokemon"])')
      const got = typeof result === 'number' ? result : JSON.stringify(result)
      const pass = got === want || (typeof got === 'string' && got.includes(String(want)))
      return {
        pass,
        note: `got ${typeof result === 'number' ? result : JSON.stringify(result).slice(0, 60)}`,
      }
    }),
  },
  {
    id: 'exact: heaviest five',
    request: 'the 5 heaviest pokemon',
    grade: notSemantic((_, result, truth) =>
      matchesIds(result, truth, '*[_type == "pokemon"] | order(weight desc)[0...5]._id'),
    ),
  },
  {
    id: 'exact: legendaries',
    request: 'list all legendary pokemon',
    grade: notSemantic((_, result, truth) =>
      matchesIds(result, truth, '*[_type == "pokemon" && isLegendary]._id'),
    ),
  },
  {
    id: 'exact: most common ability',
    request: 'which ability do the most pokemon have?',
    grade: notSemantic(async (_, result) => {
      const first = Array.isArray(result) ? result[0] : result
      const pass = JSON.stringify(first ?? null).includes('Swift Swim')
      return {pass, note: `got ${JSON.stringify(first ?? null).slice(0, 80)}`}
    }),
  },
  {
    id: 'edit: add a filter',
    request: 'only water types',
    edit: {
      query:
        '*[_type == "pokemon"] | order(nationalDexNumber asc)[0...20]{_id, name, nationalDexNumber}',
    },
    grade: notSemantic(async (attempt, result, truth) => {
      const kept = [
        'order(nationalDexNumber asc)',
        '[0...20]',
        '{_id, name, nationalDexNumber}',
      ].filter((part) => !attempt.query.includes(part))
      if (kept.length) return {pass: false, note: `lost ${kept.join(', ')}`}
      return matchesIds(
        result,
        truth,
        '*[_type == "pokemon" && "Water" in types[]->name] | order(nationalDexNumber asc)[0...20]._id',
        true,
      )
    }),
  },
  {
    id: 'edit: rank by meaning',
    request: 'instead find the ones that look like a tiny dragon',
    edit: {query: '*[_type == "pokemon"] | order(name asc)[0...10]{_id, name}'},
    grade: (attempt, result) => {
      const lost = ['[0...10]', '{_id, name}'].filter((part) => !attempt.query.includes(part))
      if (lost.length) return {pass: false, note: `lost ${lost.join(', ')}`}
      return semanticGrade(attempt, result)
    },
  },
]

/** The Vision client, with the embeddings settings read as disabled when a case asks for it */
function visionClient(client: SanityClient, withoutEmbeddings: boolean): GenerateQueryClient {
  return {
    config: () => client.config(),
    fetch: (query, params, options) => client.fetch(query, params, options),
    withConfig: (config) => client.withConfig(config),
    datasets: {
      getEmbeddingsSettings: (dataset) =>
        withoutEmbeddings
          ? Promise.resolve({enabled: false, status: 'disabled'})
          : client.datasets.getEmbeddingsSettings(dataset),
    },
  }
}

interface Run {
  grade: Grade
  query: string
  params: string
}

async function runCase(client: SanityClient, schema: Schema, item: Case): Promise<Run> {
  resetDatasetEmbeddings()
  const agent = {client: visionClient(client, Boolean(item.withoutEmbeddings))}
  let query = ''
  let params = ''
  try {
    const attempt = item.edit
      ? await editQuery({
          ...agent,
          request: item.request,
          query: item.edit.query,
          params: item.edit.params ?? {},
          schema: summarizeSchema(schema, `${item.request}\n${item.edit.query}`),
        })
      : await generateQuery({
          ...agent,
          request: item.request,
          schema: summarizeSchema(schema, item.request),
          listFields: describeDocumentListFields(
            schema,
            getRequestedDocumentTypes(schema, item.request),
          ),
        })
    query = attempt.query
    params = JSON.stringify(attempt.params)
    const result = await client.fetch(attempt.query, attempt.params)
    const grade = await item.grade(attempt, result, (truth) => client.fetch(truth))
    return {grade, query, params}
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {grade: {pass: false, note: `error: ${message}`}, query, params}
  }
}

async function main() {
  const token = process.env.SANITY_AUTH_TOKEN
  if (!token) throw new Error('Set SANITY_AUTH_TOKEN to a token with read access to the dataset')
  const client = createClient({
    projectId: args['project-id'],
    dataset: args.dataset,
    apiVersion: args['api-version'],
    token,
    useCdn: false,
  })
  const schema = createSchema({name: 'pokemon', types: pokemonSchemaTypes})
  const only = args.only
  const cases = only ? CASES.filter((item) => item.id.includes(only)) : CASES

  const rows: string[] = []
  let passed = 0
  for (const item of cases) {
    let casePassed = 0
    for (let run = 1; run <= RUNS; run++) {
      // oxlint-disable-next-line no-await-in-loop -- one run at a time keeps within the AI rate limit
      const {grade, query, params} = await runCase(client, schema, item)
      if (grade.pass) casePassed++
      console.log(
        `${grade.pass ? 'PASS' : 'FAIL'} ${item.id} #${run}: ${grade.note}\n    ${query.replace(/\s+/g, ' ')}\n    ${params}`,
      )
    }
    passed += casePassed
    rows.push(`| ${item.id} | ${casePassed}/${RUNS} |`)
  }

  console.log(
    `\n| Case | Passed |\n| --- | --- |\n${rows.join('\n')}\n| Total | ${passed}/${cases.length * RUNS} |`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
