import {type PromptRequest} from '@sanity/client'

import {isPlainObject} from '../../util/isPlainObject'
import {type EmbeddingsClient, hasDatasetEmbeddings} from './embeddings'
import {type QueryLintFinding} from './groqLint'
import {buildGroqReference} from './groqReference'
import {type LintAgentTarget} from './lintFixPlan'

/** What `generateQuery` needs of a client; a `SanityClient` has it */
export interface GenerateQueryClient extends EmbeddingsClient {
  config: () => {
    apiHost?: string
    projectId?: string
    dataset?: string
    apiVersion?: string
    perspective?: string | string[]
  }
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
export const AGENT_API_VERSION = 'vX'
export const MAX_GENERATE_ATTEMPTS = 3
const MAX_TITLE_LENGTH = 60

/**
 * Line comments carry context the query cannot (the prompt a query was generated from, notes the
 * user wrote), and models drop them when they rewrite a query
 */
const KEEP_COMMENTS = `Keep every comment (a line starting with //) of the query, including a "// Generated with the prompt:" comment at the top. Update a comment only when the change makes it inaccurate, and never delete one.`

/**
 * The user wrote, or already reviewed, the query an edit starts from: a model that rewrites it
 * from scratch makes the change hard to see in the diff and loses choices the user made
 */
const MINIMAL_EDIT = `Make the smallest change that does what is asked, to the query as it is. Keep its structure, filters, projection, attribute names, order, slices, parameter names and line breaks wherever the change does not touch them, and write new parts in the style of the existing ones. Only rework a part when the change cannot be made otherwise, like a request to rank by relevance in a query that sorts by title: then change how that part ranks and keep the rest. Keep the values of parameters the query still uses, add values for new ones and drop those it no longer uses.`

/**
 * What Vision's Documents view shows of each item of a list: a row as wide as the result pane,
 * with a thumbnail of about 34 pixels square
 */
const DOCUMENT_LIST_ROWS = `Each item of a list of documents is shown as a row, so give it _id, _type, "title" (text that names the document), "subtitle" (one line of text that tells documents apart; rows are wide, so it can combine several fields, like "subtitle": array::join(array::compact([director->name, string(releaseYear)]), " · "), since joining with + gives null when one of them is missing) and "media" (a small square thumbnail: the image field itself, like "media": poster, never its asset or a URL; prefer a thumbnail, avatar or logo over a hero or cover image, and leave "media" out when the type has no image). Put the other attributes after these.`

/** When the row attributes are known for none of the types */
const NO_DOCUMENT_LIST_FIELDS = 'Pick the row attributes from the fields of the document types.'

/**
 * Only a list of documents gets the row attributes: a count, a single document or an aggregate
 * would be changed by them, so they are named as left alone
 */
const DOCUMENT_LIST_GUIDANCE = `When the request asks for a list of documents (an array with one object per document, like *[_type == "movie"] | order(title asc)[0...20]): ${DOCUMENT_LIST_ROWS} When the request names the attributes it wants, add those too.
$listFields
Leave the row attributes out of every other kind of query: a count or another number, a single document (a [0] or a lookup by _id), a value or an array of plain values (like *[_type == "movie"].title), an object of aggregates or groups, or any other shape the request asks for.`

const INSTRUCTION = `You write GROQ queries for the Sanity Content Lake.

The request:
$request

The document types in the dataset:
$schema

How to write GROQ:
$reference

${DOCUMENT_LIST_GUIDANCE}

Reply with JSON: an object with "query" (the GROQ query, without comments or code fences), "params" (an object with a value for every parameter the query uses, or an empty object) and "title" (a name for the query of at most five words).`

const EDIT_INSTRUCTION = `You edit GROQ queries for the Sanity Content Lake.

The current query:
$query

The values of its parameters:
$params

The change to make:
$request

The document types in the dataset:
$schema

How to write GROQ:
$reference

${MINIMAL_EDIT} ${KEEP_COMMENTS}

Reply with JSON: an object with "query" (the whole query with the change made, comments included, without code fences) and "params" (an object with a value for every parameter the query uses, or an empty object).`

const FIX_LINT_INSTRUCTION = `You fix GROQ queries for the Sanity Content Lake.

The query:
$query

The values of its parameters:
$params

The problems the linter found in it, with the line and column each starts at:
$diagnostics

The document types in the dataset:
$schema

How to write GROQ:
$reference

$target Fix those problems and change nothing else. ${KEEP_COMMENTS}

Reply with JSON: an object with "query" (the whole fixed query, comments included, without code fences) and "params" (an object with a value for every parameter the query uses, or an empty object).`

const IMPROVE_INSTRUCTION = `You make GROQ queries for the Sanity Content Lake faster.

The query:
$query

The values of its parameters:
$params

The ways to improve it that a review of its query plan found:
$suggestions

The document types in the dataset:
$schema

How to write GROQ:
$reference

Make those improvements. The query must still return the same data in the same shape: leave out a suggestion that would change what it returns. ${KEEP_COMMENTS}

Reply with JSON: an object with "query" (the whole improved query, comments included, without code fences) and "params" (an object with a value for every parameter the query uses, or an empty object).`

const DOCUMENT_LIST_INSTRUCTION = `You change GROQ queries for the Sanity Content Lake so that their result can be shown as a list of documents.

The query:
$query

The values of its parameters:
$params

What it returns now:
$result

The document types in the dataset:
$schema

How to write GROQ:
$reference

Make the query return an array with one object per document. ${DOCUMENT_LIST_ROWS}
$listFields
Keep what the query selects (its filter, order, slice and parameters) and every attribute it already returns, after the row attributes; change an attribute named title, subtitle or media only when it is not what the row needs. When it returns a single document, return that document in a list of one. ${KEEP_COMMENTS}

Reply with JSON: an object with "query" (the whole changed query, comments included, without code fences) and "params" (an object with a value for every parameter the query uses, or an empty object).`

const RETRY_INSTRUCTION = `

Your previous attempt was rejected by the Content Lake:
$previous

Fix that problem in your reply.`

export interface GeneratedQuery {
  query: string
  params: Record<string, unknown>
  /** A short name for the tab; undefined when the model gave none */
  title: string | undefined
}

const LINE_BREAK_ESCAPES: Record<string, string> = {
  '\r\n': '\\r\\n',
  '\r': '\\r',
  '\n': '\\n',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
}

/**
 * The line comment a generated query starts with, naming the prompt it was written from. Line
 * breaks in the prompt are written as escapes, so the comment stays on one line and everything
 * after it is query.
 */
export function generatedQueryComment(prompt: string): string {
  const escaped = prompt.replace(/\r\n|[\r\n\u2028\u2029]/g, (match) => LINE_BREAK_ESCAPES[match])
  return `// Generated with the prompt: ${escaped}\n`
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

interface QueryAgentOptions {
  /** The workspace's document types, from `summarizeSchema` */
  schema: string
  /** The client the query will run with (dataset, API version, perspective); it checks each attempt */
  client: GenerateQueryClient
  /** Called as each attempt starts, from 1 */
  onAttempt?: (attempt: number) => void
  signal?: AbortSignal
}

export interface GenerateQueryOptions extends QueryAgentOptions {
  /** What the query should do, in the user's words */
  request: string
  /**
   * The row attributes of the requested types, from `describeDocumentListFields`, used when the
   * request asks for a list of documents
   */
  listFields?: string
}

export interface EditQueryOptions extends QueryAgentOptions {
  /** The query to change, as it is in the editor */
  query: string
  /** The values of its parameters */
  params: Record<string, unknown>
  /** What to change, in the user's words */
  request: string
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
    tag: 'vision.generate',
  })
}

export interface FixQueryLintOptions extends QueryAgentOptions {
  /** The query the diagnostics are for, as it is in the editor */
  query: string
  /** The values of its parameters */
  params: Record<string, unknown>
  /** The query editor's lint diagnostics */
  diagnostics: QueryLintFinding[]
  /** Where the problems are: in the query (the default), in the values of its params, or both */
  target?: LintAgentTarget
}

const FIX_LINT_TARGETS: Record<LintAgentTarget, string> = {
  query: 'The problems are in the query.',
  params:
    'The problems are in the values of its parameters, not in the query: fix those values, and reply with the query as it is.',
  both: 'Some problems are in the query, and those listed under Params are in the values of its parameters: fix each where it is.',
}

/** The diagnostics for the model, one per line, as the Lint panel lists them */
export function describeDiagnostics(diagnostics: QueryLintFinding[]): string {
  return diagnostics
    .map(
      (finding) =>
        `- ${
          finding.param
            ? `Params, the value of $${finding.param.name}${finding.param.path
                .map((segment) => `[${JSON.stringify(segment)}]`)
                .join('')}`
            : `Line ${finding.line}, column ${finding.column}`
        } (${finding.severity}${finding.source ? `, ${finding.source}` : ''}): ${finding.message}`,
    )
    .join('\n')
}

/**
 * Asks Agent Actions (`client.agent.action.prompt`) for a query, and compiles every attempt on
 * the Content Lake before it is accepted. A rejected attempt is retried with the API's error, up
 * to {@link MAX_GENERATE_ATTEMPTS} times. A failing prompt request (no access to Agent Actions,
 * quota) rejects right away.
 */
async function promptForQuery(
  options: Omit<QueryAgentOptions, 'schema'> & {
    instruction: string
    instructionParams: Record<string, string>
  },
): Promise<GeneratedQuery> {
  const {instruction, instructionParams, client, onAttempt, signal} = options
  const agent = client.withConfig({apiVersion: AGENT_API_VERSION}).agent.action
  const {apiVersion, perspective} = client.config()
  const reference = buildGroqReference({
    embeddings: await hasDatasetEmbeddings(client),
    apiVersion,
    perspective,
  })
  let previous: {attempt: GeneratedQuery; problem: string} | undefined

  for (let attempt = 1; attempt <= MAX_GENERATE_ATTEMPTS; attempt++) {
    signal?.throwIfAborted()
    onAttempt?.(attempt)
    // oxlint-disable-next-line no-await-in-loop -- each attempt is asked with the previous one's error
    const response: unknown = await agent.prompt({
      instruction: previous ? `${instruction}${RETRY_INSTRUCTION}` : instruction,
      instructionParams: {
        ...instructionParams,
        reference,
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
      // oxlint-disable-next-line no-await-in-loop -- the check decides whether to ask again
      await checkQuery(client, generated, signal)
      return generated
    } catch (error) {
      signal?.throwIfAborted()
      previous = {attempt: generated, problem: describeRejection(error)}
    }
  }
  throw new GenerateQueryError(previous?.problem ?? 'No query was generated', previous?.attempt)
}

/**
 * Writes a GROQ query for a request with Agent Actions: the request, the workspace's document
 * types and a GROQ primer go in.
 */
export function generateQuery(options: GenerateQueryOptions): Promise<GeneratedQuery> {
  const {request, schema, listFields, ...rest} = options
  return promptForQuery({
    ...rest,
    instruction: INSTRUCTION,
    instructionParams: {request, schema, listFields: listFields || NO_DOCUMENT_LIST_FIELDS},
  })
}

/**
 * Changes a query as the user asks with Agent Actions: the query, its parameters, the change, the
 * workspace's document types and a GROQ primer go in. The query comes back whole; the model is told
 * to keep its comments, updating only those the change makes inaccurate.
 */
export function editQuery(options: EditQueryOptions): Promise<GeneratedQuery> {
  const {query, params, request, schema, ...rest} = options
  return promptForQuery({
    ...rest,
    instruction: EDIT_INSTRUCTION,
    instructionParams: {query, params: JSON.stringify(params), request, schema},
  })
}

export interface ImproveQueryOptions extends QueryAgentOptions {
  /** The query to improve, as it is in the editor */
  query: string
  /** The values of its parameters */
  params: Record<string, unknown>
  /** The Explain panel's suggestions for the query, each one sentence */
  suggestions: string[]
}

/**
 * Makes the Explain panel's suggestions to a query with Agent Actions: the query, its parameters,
 * the suggestions, the workspace's document types and a GROQ primer go in. The query comes back
 * whole, comments kept, as an edit's does.
 */
export function improveQuery(options: ImproveQueryOptions): Promise<GeneratedQuery> {
  const {query, params, suggestions, schema, ...rest} = options
  return promptForQuery({
    ...rest,
    instruction: IMPROVE_INSTRUCTION,
    instructionParams: {
      query,
      params: JSON.stringify(params),
      suggestions: suggestions.map((suggestion) => `- ${suggestion}`).join('\n'),
      schema,
    },
  })
}

/**
 * Fixes the problems the query editor's linter found in a query with Agent Actions: the query,
 * its parameters, the diagnostics, the workspace's document types and a GROQ primer go in.
 */
export function fixQueryLint(options: FixQueryLintOptions): Promise<GeneratedQuery> {
  const {query, params, diagnostics, schema, target = 'query', ...rest} = options
  return promptForQuery({
    ...rest,
    instruction: FIX_LINT_INSTRUCTION,
    instructionParams: {
      target: FIX_LINT_TARGETS[target],
      query,
      params: JSON.stringify(params),
      diagnostics: describeDiagnostics(diagnostics),
      schema,
    },
  })
}

export interface FitQueryToDocumentListOptions extends QueryAgentOptions {
  /** The query whose result is shown, as it is in the editor */
  query: string
  /** The values of its parameters */
  params: Record<string, unknown>
  /** What the query returns now, from `describeDocumentListResult` */
  result: string
  /** The row attributes of the types it lists, from `describeDocumentListFields` */
  listFields?: string
}

/**
 * Changes a query with Agent Actions so that the Documents view can show its result: one object
 * per document, with `_id`, `_type`, `title`, `subtitle` and `media`. The query, its parameters,
 * what it returns now, the row attributes of its types, the workspace's document types and a GROQ
 * primer go in. The query comes back whole, comments kept, as an edit's does.
 */
export function fitQueryToDocumentList(
  options: FitQueryToDocumentListOptions,
): Promise<GeneratedQuery> {
  const {query, params, result, listFields, schema, ...rest} = options
  return promptForQuery({
    ...rest,
    instruction: DOCUMENT_LIST_INSTRUCTION,
    instructionParams: {
      query,
      params: JSON.stringify(params),
      result,
      listFields: listFields || NO_DOCUMENT_LIST_FIELDS,
      schema,
    },
  })
}
