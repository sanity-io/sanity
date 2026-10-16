import {AGENT_API_VERSION, type GenerateQueryClient, MAX_GENERATE_ATTEMPTS} from './generateQuery'
import {
  documentsInResult,
  type MutateClient,
  type MutationBody,
  type MutationOptions,
  type MutationPreview,
  type MutationsInput,
  previewMutations,
  readMutationFailure,
  toMutations,
} from './mutations'

/** What `generateMutations` needs of a client; a `SanityClient` has it */
export interface GenerateMutationsClient
  extends MutateClient, Pick<GenerateQueryClient, 'withConfig'> {}

/** As much of the shown result as goes into the prompt, as JSON */
const MAX_RESULT_LENGTH = 12_000

/**
 * How mutations are written, for the model, including what the API turns down that models write
 * anyway (a list of IDs in `id`)
 */
const MUTATIONS_REFERENCE = `The Mutations API takes a list of mutations and applies them in order, in one transaction. Each mutation is an object with exactly one of these keys:
- {"create": {"_type": "post", "title": "…"}}: a new document; give it an "_id" only to choose its ID
- {"createOrReplace": {"_id": "…", "_type": "…", …}}: the whole document, replacing the one with that ID
- {"createIfNotExists": {"_id": "…", "_type": "…", …}}
- {"delete": {"id": "…"}}, or {"delete": {"query": "*[_id in $ids]", "params": {"ids": ["…"]}}}
- {"patch": {"id": "…", …operations}}, or {"patch": {"query": "…", "params": {…}, …operations}} for every document the GROQ query matches
"id" is always one document ID. For several documents, write a mutation for each ID or match them with a query such as *[_id in $ids].
Patch operations, applied in this order: "set": {"title": "New title", "seo.description": "…"}, "setIfMissing": {"tags": []}, "unset": ["subtitle"], "inc": {"views": 1}, "dec": {"stock": 1}, "insert": {"after": "tags[-1]", "items": ["news"]} (or "before" and "replace").
Paths: dots for nested fields, [0] for an array position ([-1] is the last), [_key=="abc123"] for an item by its key: "tags[0]", "body[_key==\\"abc123\\"].children".
References are {"_type": "reference", "_ref": "<the published document ID>"}. Objects in arrays need a "_key" of 12 random letters and digits.
Never set _rev, _createdAt or _updatedAt, and use the fields the schema has for the document's type.`

const INSTRUCTION = `You write mutations for the Sanity Content Lake.

The request:
$request

The documents of the result the user is looking at, by the IDs to mutate them under (a draft or a version is listed under its own ID). Words such as "these documents", "the documents" or "the ones I am looking at" mean these:
$documents

The result itself, as JSON:
$result

The document types in the dataset:
$schema

How mutations are written:
$reference

Reply with JSON: an object with "mutations", the list of mutations that do what the request asks.`

const RETRY_INSTRUCTION = `${INSTRUCTION}

Your previous attempt was rejected by the Content Lake:
$previous

Fix that problem in your reply.`

export interface GeneratedMutations {
  mutations: MutationBody[]
  /** The dry run that checked them */
  preview: MutationPreview
}

/** Every attempt was rejected; the last one is kept so it can still be opened and fixed by hand */
export class GenerateMutationsError extends Error {
  readonly lastAttempt: MutationBody[] | undefined
  constructor(message: string, lastAttempt: MutationBody[] | undefined) {
    super(message)
    this.name = 'GenerateMutationsError'
    this.lastAttempt = lastAttempt
  }
}

export interface GenerateMutationsOptions {
  /** What the mutations should do, in the user's words */
  request: string
  /** The result the user is looking at, which "these documents" refers to */
  result: unknown
  /** The workspace's document types, from `summarizeSchema` */
  schema: string
  /** The client of the dataset the mutations go to; it dry-runs each attempt */
  client: GenerateMutationsClient
  /** What the dry runs send along, as Apply would */
  mutationOptions: MutationOptions
  /** Called as each attempt starts, from 1 */
  onAttempt?: (attempt: number) => void
  signal?: AbortSignal
}

function describeInput(input: Exclude<MutationsInput, {status: 'valid'}>): string {
  switch (input.status) {
    case 'empty':
      return 'The reply had no mutations'
    case 'invalid-json':
      return `The reply was not JSON: ${input.message}`
    case 'not-a-list':
      return 'The reply had no list of mutations'
    case 'invalid-mutation':
      return `Mutation ${input.index} needs exactly one of create, createOrReplace, createIfNotExists, delete or patch`
    default: {
      const unknownInput: never = input
      return String(unknownInput)
    }
  }
}

/** The documents by ID and type, one per line */
function describeDocuments(result: unknown): string {
  const documents = documentsInResult(result)
  if (documents.length === 0) return '(none: the result holds no documents)'
  return documents
    .map((document) => (document.type ? `- ${document.id} (${document.type})` : `- ${document.id}`))
    .join('\n')
}

function describeResult(result: unknown): string {
  const json = JSON.stringify(result) ?? 'null'
  return json.length > MAX_RESULT_LENGTH ? `${json.slice(0, MAX_RESULT_LENGTH)}… (cut short)` : json
}

/**
 * Writes mutations for a request with Agent Actions (`client.agent.action.prompt`): the request,
 * the documents of the result the user is looking at, the workspace's document types and a
 * primer on mutations go in, and every attempt is dry-run on the Content Lake, which writes
 * nothing, before it is accepted. A rejected attempt is retried with the API's error, up to
 * {@link MAX_GENERATE_ATTEMPTS} times. A failing prompt request (no access to Agent Actions,
 * quota) rejects right away.
 */
export async function generateMutations(
  options: GenerateMutationsOptions,
): Promise<GeneratedMutations> {
  const {request, result, schema, client, mutationOptions, onAttempt, signal} = options
  const agent = client.withConfig({apiVersion: AGENT_API_VERSION}).agent.action
  const documents = describeDocuments(result)
  const resultJson = describeResult(result)
  let previous: {attempt: unknown; problem: string} | undefined
  // The last attempt the dry run turned down, for opening by hand: a later reply may not even parse
  let lastRejected: MutationBody[] | undefined

  for (let attempt = 1; attempt <= MAX_GENERATE_ATTEMPTS; attempt++) {
    signal?.throwIfAborted()
    onAttempt?.(attempt)
    // oxlint-disable-next-line no-await-in-loop -- each attempt is asked with the previous one's error
    const response: unknown = await agent.prompt({
      instruction: previous ? RETRY_INSTRUCTION : INSTRUCTION,
      instructionParams: {
        request,
        documents,
        result: resultJson,
        schema,
        reference: MUTATIONS_REFERENCE,
        ...(previous
          ? {previous: `${JSON.stringify(previous.attempt)}\nError: ${previous.problem}`}
          : {}),
      },
      format: 'json',
      temperature: 0.2,
    })
    signal?.throwIfAborted()
    const input = toMutations(response)
    if (input.status !== 'valid') {
      previous = {attempt: response, problem: describeInput(input)}
      continue
    }
    try {
      // oxlint-disable-next-line no-await-in-loop -- the dry run decides whether to ask again
      const preview = await previewMutations(client, input.mutations, mutationOptions)
      return {mutations: input.mutations, preview}
    } catch (error) {
      signal?.throwIfAborted()
      const failure = readMutationFailure(error)
      lastRejected = input.mutations
      previous = {
        attempt: input.mutations,
        problem: [
          failure.message,
          ...failure.items.map((item) => `Mutation ${item.index}: ${item.message}`),
        ].join('\n'),
      }
    }
  }
  throw new GenerateMutationsError(previous?.problem ?? 'No mutations were generated', lastRejected)
}
