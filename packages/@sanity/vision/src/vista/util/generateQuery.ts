import {type PromptRequest} from '@sanity/client'

import {isPlainObject} from '../../util/isPlainObject'

/** What `generateQuery` needs of a client; a `SanityClient` has it */
export interface GenerateQueryClient {
  fetch: (
    query: string,
    params: Record<string, unknown>,
    options: {signal?: AbortSignal; tag: string},
  ) => Promise<unknown>
  withConfig: (config: {apiVersion: string}) => {
    agent: {action: {prompt: (request: PromptRequest) => Promise<unknown>}}
  }
}

/** Agent Actions only exist on the experimental API */
const AGENT_API_VERSION = 'vX'
export const MAX_GENERATE_ATTEMPTS = 3
const MAX_TITLE_LENGTH = 60

/**
 * How GROQ works, for the model: the patterns a query needs, and the jq, SQL and JavaScript
 * habits models fall back on (the API rejects those, and a retry quotes its error)
 */
const GROQ_REFERENCE = `GROQ is the query language of the Sanity Content Lake. It is not jq, SQL or JavaScript.
- A query usually starts with * (every document), filtered in brackets: *[_type == "movie" && releaseYear >= 1979]
- A projection picks and computes attributes: {_id, title, "director": director->name, "castCount": count(cast)}
- Order with the order() pipe function, then slice: *[_type == "movie"] | order(releaseDate desc, title asc)[0...10]
- [0...10] is the first ten (the end is excluded), [0] is the first match alone
- To pick some documents by one order and show them in another, slice first and order again: *[_type == "movie"] | order(_createdAt desc)[0...10] | order(title asc)
- Follow references with ->: author->name, categories[]->title; find documents that reference another with references($id)
- Text search: title match "word*"; membership: "news" in tags; logic: &&, ||, !; existence: defined(field)
- Functions include count(), defined(), coalesce(), select(), round(), lower(), upper(), now(), dateTime(), string::split(), array::unique(), math::sum(), pt::text()
- Parameters are names that start with $ (like $type); their values are given separately
- Every document has _id, _type, _createdAt, _updatedAt and _rev; "recent" or "newest" usually means _createdAt desc
- Use the field names of the schema; when the request names something the schema lacks, use the closest field
- Never use jq or SQL syntax: no .[] or .field after a pipe, no sort_by(), map() or select(.x), no LIMIT, ORDER BY or SELECT`

const INSTRUCTION = `You write GROQ queries for the Sanity Content Lake.

The request:
$request

The document types in the dataset:
$schema

How to write GROQ:
$reference

Reply with JSON: an object with "query" (the GROQ query, without comments or code fences), "params" (an object with a value for every parameter the query uses, or an empty object) and "title" (a name for the query of at most five words).`

const RETRY_INSTRUCTION = `${INSTRUCTION}

Your previous attempt was rejected by the Content Lake:
$previous

Fix that problem in your reply.`

export interface GeneratedQuery {
  query: string
  params: Record<string, unknown>
  /** A short name for the tab; undefined when the model gave none */
  title: string | undefined
}

/** Every attempt was rejected; the last one is kept so it can still be opened and fixed by hand */
export class GenerateQueryError extends Error {
  readonly lastAttempt: GeneratedQuery | undefined
  constructor(message: string, lastAttempt: GeneratedQuery | undefined) {
    super(message)
    this.name = 'GenerateQueryError'
    this.lastAttempt = lastAttempt
  }
}

export interface GenerateQueryOptions {
  /** What the query should do, in the user's words */
  request: string
  /** The workspace's document types, from `summarizeSchema` */
  schema: string
  /** The client the query will run with (dataset, API version, perspective); it checks each attempt */
  client: GenerateQueryClient
  /** Called as each attempt starts, from 1 */
  onAttempt?: (attempt: number) => void
  signal?: AbortSignal
}

function toGeneratedQuery(response: unknown): GeneratedQuery {
  const record = isPlainObject(response) ? response : {}
  const query = typeof record.query === 'string' ? record.query.trim() : ''
  const title = typeof record.title === 'string' ? record.title.trim() : ''
  return {
    query,
    params: isPlainObject(record.params) ? record.params : {},
    title: title && title.length <= MAX_TITLE_LENGTH ? title : undefined,
  }
}

/** The Content Lake's explanation of a rejected query, from the response body when it has one */
function describeRejection(error: unknown): string {
  const details =
    typeof error === 'object' && error !== null && 'details' in error ? error.details : undefined
  if (isPlainObject(details) && typeof details.description === 'string') {
    return details.description
  }
  return error instanceof Error ? error.message : String(error)
}

/**
 * Compiles the query on the Content Lake without running it: `select(false => …)` never
 * evaluates its value, yet the whole query is parsed, its functions resolved and its parameters
 * checked, by the API the query will run on. The line breaks keep a trailing comment from
 * swallowing the closing parentheses.
 */
async function checkQuery(
  client: GenerateQueryClient,
  attempt: GeneratedQuery,
  signal?: AbortSignal,
) {
  await client.fetch(`select(false => (\n${attempt.query}\n))`, attempt.params, {
    signal,
    tag: 'vista.generate',
  })
}

/**
 * Writes a GROQ query for a request with Agent Actions (`client.agent.action.prompt`): the
 * request, the workspace's document types and a GROQ primer go in, and every attempt is compiled
 * on the Content Lake before it is accepted. A rejected attempt is retried with the API's error,
 * up to {@link MAX_GENERATE_ATTEMPTS} times. A failing prompt request (no access to Agent
 * Actions, quota) rejects right away.
 */
export async function generateQuery(options: GenerateQueryOptions): Promise<GeneratedQuery> {
  const {request, schema, client, onAttempt, signal} = options
  const agent = client.withConfig({apiVersion: AGENT_API_VERSION}).agent.action
  let previous: {attempt: GeneratedQuery; problem: string} | undefined

  for (let attempt = 1; attempt <= MAX_GENERATE_ATTEMPTS; attempt++) {
    signal?.throwIfAborted()
    onAttempt?.(attempt)
    const response: unknown = await agent.prompt({
      instruction: previous ? RETRY_INSTRUCTION : INSTRUCTION,
      instructionParams: {
        request,
        schema,
        reference: GROQ_REFERENCE,
        ...(previous
          ? {previous: `${JSON.stringify(previous.attempt)}\nError: ${previous.problem}`}
          : {}),
      },
      format: 'json',
      temperature: 0.2,
    })
    signal?.throwIfAborted()
    const generated = toGeneratedQuery(response)
    if (!generated.query) {
      previous = {attempt: generated, problem: 'The reply had no query'}
      continue
    }
    try {
      await checkQuery(client, generated, signal)
      return generated
    } catch (error) {
      signal?.throwIfAborted()
      previous = {attempt: generated, problem: describeRejection(error)}
    }
  }
  throw new GenerateQueryError(previous?.problem ?? 'No query was generated', previous?.attempt)
}
