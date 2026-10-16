import {type PromptRequest} from '@sanity/client'

import {encodeQueryString} from '../../util/encodeQueryString'
import {isPlainObject} from '../../util/isPlainObject'

/** What explaining a query needs of a client; a `SanityClient` has it */
export interface ExplainQueryClient {
  getDataUrl: (operation: string, path?: string) => string
  request: (options: {url: string; tag: string; signal?: AbortSignal}) => Promise<unknown>
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
 * fetch of it would.
 */
export async function fetchQueryPlan(
  client: ExplainQueryClient,
  {query, params}: ExplainedQuery,
  signal?: AbortSignal,
): Promise<string> {
  const response = await client.request({
    url: client.getDataUrl('query', encodeQueryString(query, params, {explain: 'true'})),
    tag: 'vista.explain',
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

const EXPLAIN_INSTRUCTION = `Explain a GROQ query of the Sanity Content Lake to a developer who wrote it.

The query:
$query

Its parameters:
$params

The plan the Content Lake made for it:
$plan

$glossary

First say in a sentence or two what the query fetches and returns. Then walk through how the plan runs it: what the Fetch step reads, which filters, sorting and limits it applies while reading, and what is left for later steps such as projections and joins. End with anything that could make it slow on a large dataset, or say that nothing stands out. Write plain text in short paragraphs, without markdown headings or code fences.`

/** Agent Actions only exist on the experimental API */
const AGENT_API_VERSION = 'vX'

/** A plain-language explanation of a query and its plan, written by Agent Actions */
export async function explainQuery(
  client: ExplainQueryClient,
  {query, params}: ExplainedQuery,
  plan: string,
): Promise<string> {
  const response = await client.withConfig({apiVersion: AGENT_API_VERSION}).agent.action.prompt({
    instruction: EXPLAIN_INSTRUCTION,
    instructionParams: {query, params: JSON.stringify(params), plan, glossary: PLAN_GLOSSARY},
    temperature: 0.2,
  })
  if (typeof response !== 'string' || !response.trim()) {
    throw new Error('The explanation came back empty')
  }
  return response.trim()
}
