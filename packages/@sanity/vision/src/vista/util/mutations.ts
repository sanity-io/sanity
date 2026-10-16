import {dequal} from 'dequal/lite'

import {isPlainObject} from '../../util/isPlainObject'
import {deltaOperation} from './deltaQuery'

/** What a mutation does, one per mutation, as the Mutations API takes them */
export const MUTATION_KINDS = [
  'create',
  'createOrReplace',
  'createIfNotExists',
  'delete',
  'patch',
] as const

export type MutationKind = (typeof MUTATION_KINDS)[number]

export type MutationBody = Record<string, unknown>

export type MutationsInput =
  | {status: 'empty'}
  | {status: 'invalid-json'; message: string}
  | {status: 'not-a-list'}
  /** A mutation without exactly one of the kinds; `index` counts from 1 */
  | {status: 'invalid-mutation'; index: number}
  | {status: 'valid'; mutations: MutationBody[]}

function isMutationKind(key: string): key is MutationKind {
  return MUTATION_KINDS.some((kind) => kind === key)
}

/** Mutations written as JSON (see `toMutations`) */
export function readMutations(text: string): MutationsInput {
  if (!text.trim()) return {status: 'empty'}
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch (error) {
    return {status: 'invalid-json', message: error instanceof Error ? error.message : String(error)}
  }
  return toMutations(value)
}

/**
 * Mutations as the Mutations API takes them: a list, a request body (`{"mutations": [...]}`) or a
 * single mutation. The API checks what each one holds.
 */
export function toMutations(value: unknown): MutationsInput {
  let list: unknown[] | undefined
  if (Array.isArray(value)) list = value
  else if (isPlainObject(value)) list = Array.isArray(value.mutations) ? value.mutations : [value]
  if (!list) return {status: 'not-a-list'}
  if (list.length === 0) return {status: 'empty'}

  const mutations: MutationBody[] = []
  for (const [index, item] of list.entries()) {
    const keys = isPlainObject(item) ? Object.keys(item) : []
    if (!isPlainObject(item) || keys.length !== 1 || !isMutationKind(keys[0])) {
      return {status: 'invalid-mutation', index: index + 1}
    }
    mutations.push(item)
  }
  return {status: 'valid', mutations}
}

export interface ResultDocument {
  id: string
  type: string | undefined
}

/**
 * The documents a query result holds, by the IDs they are stored under: under a perspective a
 * draft or a version answers with the published `_id`, and its own in `_originalId`
 */
export function documentsInResult(result: unknown): ResultDocument[] {
  const seen = new Set<string>()
  const documents: ResultDocument[] = []
  for (const item of Array.isArray(result) ? result : [result]) {
    if (!isPlainObject(item)) continue
    const id =
      typeof item._originalId === 'string'
        ? item._originalId
        : typeof item._id === 'string'
          ? item._id
          : undefined
    if (!id || seen.has(id)) continue
    seen.add(id)
    documents.push({id, type: typeof item._type === 'string' ? item._type : undefined})
  }
  return documents
}

export type MutationTemplate = 'patch' | 'create' | 'delete'

/**
 * A mutation to start from, aimed at the documents of the shown result where it has any. The API
 * takes one ID per patch or delete, so several documents are aimed at by query.
 */
export function createMutationTemplate(
  template: MutationTemplate,
  documents: ResultDocument[],
): MutationBody {
  const ids = documents.map((document) => document.id)
  const target = ids.length > 1 ? {query: '*[_id in $ids]', params: {ids}} : {id: ids[0] ?? ''}
  switch (template) {
    case 'patch':
      return {patch: {...target, set: {}}}
    case 'create':
      return {create: {_type: documents[0]?.type ?? ''}}
    case 'delete':
      return {delete: target}
    default: {
      const unknownTemplate: never = template
      throw new Error(`Unknown mutation template: ${String(unknownTemplate)}`)
    }
  }
}

/** The mutations with one more, or a list of just it; `undefined` when the text is no list */
export function addMutation(text: string, mutation: MutationBody): string | undefined {
  const input = readMutations(text)
  if (input.status === 'empty') return JSON.stringify([mutation], null, 2)
  if (input.status !== 'valid') return undefined
  return JSON.stringify([...input.mutations, mutation], null, 2)
}

/** What previewing and applying mutations needs of a client; a `SanityClient` has it */
export interface MutateClient {
  getDataUrl: (operation: string, path?: string) => string
  request: (options: {
    url: string
    method: 'POST'
    body: {mutations: MutationBody[]}
    query: Record<string, string>
    tag: string
  }) => Promise<unknown>
  getDocuments: (ids: string[], options: {tag: string}) => Promise<unknown[]>
}

export interface MutationOptions {
  /** Gives array items without a `_key` one, which the studio needs to edit them */
  autoGenerateArrayKeys: boolean
}

/**
 * What a dry run ran, as a key: Apply only sends mutations whose dry run has this key, so editing
 * them, switching the dataset or changing an option asks for another dry run
 */
export function mutationRunKey(
  dataset: string,
  mutations: MutationBody[],
  options: MutationOptions,
): string {
  return JSON.stringify([dataset, mutations, options])
}

export type ChangeOperation = 'create' | 'update' | 'delete' | 'none'

export interface DocumentChange {
  id: string
  operation: ChangeOperation
  /** The document as it is now; `null` when the mutations create it */
  before: Record<string, unknown> | null
  /** The document as the mutations leave it; `null` when they delete it */
  after: Record<string, unknown> | null
}

export interface MutationPreview {
  /** The documents the mutations touch, in the order the API lists them */
  changes: DocumentChange[]
  /** Documents touched beyond the first `PREVIEW_LIMIT`, which are counted but not compared */
  notShown: number
}

export interface AppliedMutations {
  transactionId: string
  documentIds: string[]
}

/** Documents compared in a preview; each one is fetched as it is now to compare with */
export const PREVIEW_LIMIT = 50

interface MutationResult {
  id: string
  operation: string
  document: Record<string, unknown> | undefined
}

/**
 * The API answers with one result per document, whatever number of mutations touched it: the
 * operation they amount to and, asked for, the document as they leave it (as it was, for a delete)
 */
function readResults(body: unknown): MutationResult[] {
  const results = isPlainObject(body) && Array.isArray(body.results) ? body.results : []
  return results.flatMap((result): MutationResult[] =>
    isPlainObject(result) && typeof result.id === 'string'
      ? [
          {
            id: result.id,
            operation: typeof result.operation === 'string' ? result.operation : 'update',
            document: isPlainObject(result.document) ? result.document : undefined,
          },
        ]
      : [],
  )
}

function mutationQuery(options: MutationOptions, dryRun: boolean): Record<string, string> {
  return {
    returnIds: 'true',
    visibility: 'sync',
    ...(dryRun ? {dryRun: 'true', returnDocuments: 'true'} : {}),
    ...(options.autoGenerateArrayKeys ? {autoGenerateArrayKeys: 'true'} : {}),
  }
}

function withoutRevision(document: Record<string, unknown>): Record<string, unknown> {
  const {_rev, _updatedAt, ...content} = document
  return content
}

/**
 * What the change does to the content. The API reports a patch that sets what is already there,
 * or a `createIfNotExists` of a document that exists, as an update with a new `_rev`
 */
function changeOperation(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
): ChangeOperation {
  const operation = deltaOperation(before, after)
  if (operation === null) return 'none'
  if (before && after && dequal(withoutRevision(before), withoutRevision(after))) return 'none'
  return operation
}

/** Runs the mutations as a dry run, which changes nothing, and compares what they would change */
export async function previewMutations(
  client: MutateClient,
  mutations: MutationBody[],
  options: MutationOptions,
): Promise<MutationPreview> {
  const body = await client.request({
    url: client.getDataUrl('mutate'),
    method: 'POST',
    body: {mutations},
    query: mutationQuery(options, true),
    tag: 'vista.mutate',
  })
  const results = readResults(body)
  const shown = results.slice(0, PREVIEW_LIMIT)
  // By ID, which is how the documents are stored: no perspective applies
  const current =
    shown.length > 0
      ? await client.getDocuments(
          shown.map((result) => result.id),
          {tag: 'vista.mutate'},
        )
      : []
  return {
    changes: shown.map((result, index): DocumentChange => {
      const existing = current[index]
      const before = isPlainObject(existing) ? existing : null
      const after = result.operation === 'delete' ? null : (result.document ?? before)
      return {id: result.id, operation: changeOperation(before, after), before, after}
    }),
    notShown: results.length - shown.length,
  }
}

/** Commits the mutations in one transaction */
export async function applyMutations(
  client: MutateClient,
  mutations: MutationBody[],
  options: MutationOptions,
): Promise<AppliedMutations> {
  const body = await client.request({
    url: client.getDataUrl('mutate'),
    method: 'POST',
    body: {mutations},
    query: mutationQuery(options, false),
    tag: 'vista.mutate',
  })
  return {
    transactionId:
      isPlainObject(body) && typeof body.transactionId === 'string' ? body.transactionId : '',
    documentIds: readResults(body).map((result) => result.id),
  }
}

export interface MutationFailure {
  message: string
  /** What the API says went wrong with each mutation it names; `index` counts from 1 */
  items: {index: number; message: string}[]
}

/** A failed mutation request as the API explains it, mutation by mutation where it does */
export function readMutationFailure(error: unknown): MutationFailure {
  const details: unknown = error instanceof Error ? Reflect.get(error, 'details') : undefined
  if (isPlainObject(details) && typeof details.description === 'string') {
    const items = Array.isArray(details.items) ? details.items : []
    return {
      message: details.description,
      items: items.flatMap((item) =>
        isPlainObject(item) &&
        typeof item.index === 'number' &&
        isPlainObject(item.error) &&
        typeof item.error.description === 'string'
          ? [{index: item.index + 1, message: item.error.description}]
          : [],
      ),
    }
  }
  return {message: error instanceof Error ? error.message : String(error), items: []}
}
