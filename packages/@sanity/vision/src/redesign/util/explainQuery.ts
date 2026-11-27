import {type PromptRequest} from '@sanity/client'

import {encodeQueryString} from '../../util/encodeQueryString'
import {isPlainObject} from '../../util/isPlainObject'
import {type QueryRequestMethod, queryRequestMethod} from '../../util/queryRequestMethod'

/** What explaining a query needs of a client; a `SanityClient` has it */
export interface ExplainQueryClient {
  getDataUrl: (operation: string, path?: string) => string
  request: (options: {
    url: string
    method: QueryRequestMethod
    body: {query: string; params: Record<string, unknown>} | undefined
    canUseCdn: boolean
    tag: string
    signal?: AbortSignal
  }) => Promise<unknown>
  withConfig: (config: {apiVersion: string}) => {
    agent: {action: {prompt: (request: PromptRequest) => Promise<unknown>}}
  }
}

export interface ExplainedQuery {
  query: string
  params: Record<string, unknown>
}

/**
 * The Content Lake's plan for a query: how it fetches, filters, sorts and projects. `explain`
 * is a query endpoint option `@sanity/client`'s `fetch` has no way to send, so the query URL is
 * requested directly; the client still adds its perspective and variant. The query runs, as any
 * fetch of it would, and travels as `fetch` would send it: in the URL while the query and params
 * fit one, as a JSON body from the client's size limit on, with `explain` staying in the URL
 * either way.
 */
export async function fetchQueryPlan(
  client: ExplainQueryClient,
  {query, params}: ExplainedQuery,
  signal?: AbortSignal,
): Promise<string> {
  const method = queryRequestMethod(query, params)
  const response = await client.request({
    url: client.getDataUrl(
      'query',
      method === 'GET' ? encodeQueryString(query, params, {explain: 'true'}) : '?explain=true',
    ),
    method,
    body: method === 'POST' ? {query, params} : undefined,
    // `request` only lets a GET through the API CDN on its own; `fetch` sends a posted query
    // there too, so the plan comes from wherever the query would have run
    canUseCdn: true,
    tag: 'vision.explain',
    signal,
  })
  const plan = isPlainObject(response) ? response.explain : undefined
  if (typeof plan !== 'string') throw new Error('The response had no query plan')
  return plan.trim()
}

/**
 * What the plan's nodes mean, for the model, which otherwise guesses (and guesses wrong, as the
 * Content Lake team found); drawn from plans the API returns
 */
const PLAN_GLOSSARY = `How to read the plan:
- Pipeline: the steps that compute the result, r1, r2 and so on in order. Each step reads the rows of an earlier one (Source: r1) and adds a column ($0, $1, ...). Result names the column the query returns. OneShot only says the step runs once.
- StreamStep with a Fetch from DataSource: reads documents from the dataset's index. Its Filter, Sort, Limit and Score are applied by the index while reading, which is fast; Selection lists the attributes it reads. A Fetch without a Limit reads every document its Filter matches.
- Fetch from an ArraySource: goes through an array an earlier step computed, without reading the dataset.
- Aggregate: computes count() and similar functions in the index, without reading the documents.
- MapStep: computes a value for every row, such as a projection.
- ExtendStep: brings a value from the enclosing scope (^) into a nested pipeline.
- ResolveRefStep: follows a reference (->) for every row, in batches.
- HashBatchStep: runs a subquery once for all rows, in a single batched Fetch, rather than once per row.
- FilterStep: filters rows in memory, after they were read. Everything the Fetch let through was read first, so a FilterStep means part of the filter could not use the index, typically a join with -> or a function in the filter, and it gets slow on large datasets.
- SortStep and SliceStep: sort or slice in memory after reading, rather than in the index.
Describe steps only by these meanings. For a step not listed here, say what its name suggests and that it is not described here.`

const EXPLAIN_INSTRUCTION = `Explain a GROQ query of the Sanity Content Lake to someone new to Sanity, who may not know GROQ or databases.

The query:
$query

Its parameters:
$params

The plan the Content Lake made for it:
$plan

$glossary

Reply with JSON: an object with these attributes.
- "summary": what the query finds and returns, and in broad strokes how the Content Lake gets it, in two to four short sentences of everyday words. Do not name plan steps (Fetch, FilterStep and so on), and explain any term a beginner would not know.
- "verdict": exactly one of "performant" (the query is fast and nothing needs to change), "cannot-improve" (it does slow work, but there is no faster way to get this data; it takes this work either way) or "improvable" (a change to the query would make it faster).
- "verdictReason": one plain sentence saying why that verdict fits this query.
- "suggestions": an array of concrete changes to the query that would make it faster or lighter, each one sentence a beginner can act on, naming the part of the query to change. Quote GROQ in backticks. An empty array when there is nothing worth changing, which is always the case for "performant".
- "details": how the plan runs the query, for readers who want the technical detail: what the Fetch step reads, which filters, sorting and limits it applies while reading, and what is left for later steps such as projections and joins. Short paragraphs separated by blank lines, plain text without markdown headings or code fences.`

/** Agent Actions only exist on the experimental API */
const AGENT_API_VERSION = 'vX'

/** How well a query runs, as the explanation judges it */
export type QueryVerdict = 'performant' | 'cannot-improve' | 'improvable'

const QUERY_VERDICTS: readonly QueryVerdict[] = ['performant', 'cannot-improve', 'improvable']

/** An explanation of a query and its plan, written by Agent Actions */
export interface QueryExplanation {
  /** What the query does and how it runs, in plain words */
  summary: string
  verdict: QueryVerdict
  /** Why the verdict fits; empty when the model gave no reason */
  verdictReason: string
  /** Changes to the query that would make it faster, each one sentence */
  suggestions: string[]
  /** How the plan runs the query, step by step; empty when the model left it out */
  details: string
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function readVerdict(value: unknown, suggestions: string[]): QueryVerdict {
  const verdict = QUERY_VERDICTS.find((known) => known === value)
  if (verdict) return verdict
  return suggestions.length > 0 ? 'improvable' : 'performant'
}

/** The model's reply as an explanation; a reply without a summary is no explanation */
export function toQueryExplanation(response: unknown): QueryExplanation {
  const record = isPlainObject(response) ? response : {}
  const summary = readString(record.summary)
  if (!summary) throw new Error('The explanation came back empty')
  const suggestions = Array.isArray(record.suggestions)
    ? record.suggestions.map(readString).filter(Boolean)
    : []
  return {
    summary,
    verdict: readVerdict(record.verdict, suggestions),
    verdictReason: readString(record.verdictReason),
    suggestions,
    details: readString(record.details),
  }
}

/** A plain-language explanation of a query and its plan, written by Agent Actions */
export async function explainQuery(
  client: ExplainQueryClient,
  {query, params}: ExplainedQuery,
  plan: string,
): Promise<QueryExplanation> {
  const response = await client.withConfig({apiVersion: AGENT_API_VERSION}).agent.action.prompt({
    instruction: EXPLAIN_INSTRUCTION,
    instructionParams: {query, params: JSON.stringify(params), plan, glossary: PLAN_GLOSSARY},
    format: 'json',
    temperature: 0.2,
  })
  return toQueryExplanation(response)
}
