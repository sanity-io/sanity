import {isDeepStrictEqual} from 'node:util'

import {type SanityDocument} from '@sanity/types'
import * as fc from 'fast-check'
import {expect} from 'vitest'

import {createSchema} from '../../src/core/schema/createSchema'
import {type MutationPayload} from '../../src/core/store/document/buffered-doc/types'
import {type SubmissionRecord} from './fakeContentLake'
import {type LostEditFateKind, lostEdits, wasDiscardedOnPurpose} from './lostEdits'
import {
  expectConverged,
  expectHealthy,
  expectKeysConserved,
  expectNoLostEdits,
  expectRevisionsAgree,
  keysOf,
} from './oracles'
import {type RawPatch} from './studioEngine'
import {
  createWorld,
  type EditRecord,
  runSteps,
  type Step,
  type SyncTestDefinition,
  type World,
} from './syncTest'
import {captureUnhandledRejections, type UnhandledRejections} from './unhandledRejections'

const PUBLISHED_ID = 'article-gen'
const DRAFT_ID = 'drafts.article-gen'
const FIELD = 'items'
const CLIENTS = ['A', 'B'] as const
const INITIAL_KEYS = ['a', 'b']
const TITLES = ['one', 'two', 'three']
const MAX_PENDING_ACCEPTS = 20

export const articleSchema = createSchema({
  name: 'generated',
  types: [
    {
      name: 'article',
      type: 'document',
      fields: [
        {name: 'title', type: 'string'},
        {name: 'afterDrop', type: 'boolean'},
        {
          name: FIELD,
          type: 'array',
          of: [{type: 'object', name: 'item', fields: [{name: 'title', type: 'string'}]}],
        },
      ],
    },
  ],
})

type ClientId = (typeof CLIENTS)[number]
type Actor = ClientId | 'outside'

type Edit =
  | {type: 'setTitle'; title: string}
  | {type: 'unsetTitle'}
  | {type: 'insertItem'}
  | {type: 'unsetItem'; keyIndex: number}
  | {type: 'renameItem'; keyIndex: number; title: string}
  | {type: 'moveItem'; keyIndex: number}

export type Intent =
  | {kind: 'edit'; client: ClientId; edit: Edit}
  | {kind: 'outside'; edit: Edit}
  | {kind: 'commit'; client: ClientId}
  | {kind: 'commits'; client: ClientId; mode: 'auto' | 'hold'}
  | {kind: 'settleCommit'; client: ClientId; outcome: 'accept' | 409 | 500}
  | {kind: 'listener'; client: ClientId; mode: 'auto' | 'hold'}
  | {kind: 'releaseEvents'; client: ClientId; count?: number; order: 'fifo' | 'reverse'}
  | {kind: 'dropEvent'; client: ClientId}
  | {kind: 'disconnect'; client: ClientId}
  | {kind: 'reconnect'; client: ClientId; resume: boolean}
  | {kind: 'advance'; ms: number}

interface ClientState {
  commits: 'auto' | 'hold'
  listener: 'auto' | 'hold'
  connection: 'up' | 'down'
  heldEvents: 'none' | 'maybe'
}

export interface KeyTouch {
  key: string
  type: 'insert' | 'unset' | 'move'
  /** The client's recorded edit; an outside edit has none. */
  edit?: EditRecord
}

export interface KeyHistory {
  world: World
  initialKeys: string[]
  touches: KeyTouch[]
}

const clientArbitrary = fc.constantFrom(...CLIENTS)
const keyIndexArbitrary = fc.nat({max: 7})
const titleArbitrary = fc.constantFrom(...TITLES)

const editArbitrary: fc.Arbitrary<Edit> = fc.oneof(
  {
    weight: 3,
    arbitrary: fc.record({type: fc.constant('setTitle' as const), title: titleArbitrary}),
  },
  {weight: 1, arbitrary: fc.record({type: fc.constant('unsetTitle' as const)})},
  {weight: 3, arbitrary: fc.record({type: fc.constant('insertItem' as const)})},
  {
    weight: 2,
    arbitrary: fc.record({type: fc.constant('unsetItem' as const), keyIndex: keyIndexArbitrary}),
  },
  {
    weight: 2,
    arbitrary: fc.record({
      type: fc.constant('renameItem' as const),
      keyIndex: keyIndexArbitrary,
      title: titleArbitrary,
    }),
  },
  {
    weight: 2,
    arbitrary: fc.record({type: fc.constant('moveItem' as const), keyIndex: keyIndexArbitrary}),
  },
)

const intentArbitrary: fc.Arbitrary<Intent> = fc.oneof(
  {
    weight: 6,
    arbitrary: fc.record({
      kind: fc.constant('edit' as const),
      client: clientArbitrary,
      edit: editArbitrary,
    }),
  },
  {weight: 1, arbitrary: fc.record({kind: fc.constant('outside' as const), edit: editArbitrary})},
  {
    weight: 4,
    arbitrary: fc.record({kind: fc.constant('commit' as const), client: clientArbitrary}),
  },
  {
    weight: 2,
    arbitrary: fc.record({
      kind: fc.constant('commits' as const),
      client: clientArbitrary,
      mode: fc.constantFrom('auto' as const, 'hold' as const),
    }),
  },
  {
    weight: 2,
    arbitrary: fc.record({
      kind: fc.constant('settleCommit' as const),
      client: clientArbitrary,
      outcome: fc.constantFrom('accept' as const, 409 as const, 500 as const),
    }),
  },
  {
    weight: 2,
    arbitrary: fc.record({
      kind: fc.constant('listener' as const),
      client: clientArbitrary,
      mode: fc.constantFrom('auto' as const, 'hold' as const),
    }),
  },
  {
    weight: 2,
    arbitrary: fc.record(
      {
        kind: fc.constant('releaseEvents' as const),
        client: clientArbitrary,
        count: fc.integer({min: 1, max: 3}),
        order: fc.constantFrom('fifo' as const, 'reverse' as const),
      },
      {requiredKeys: ['kind', 'client', 'order']},
    ),
  },
  {
    weight: 1,
    arbitrary: fc.record({kind: fc.constant('dropEvent' as const), client: clientArbitrary}),
  },
  {
    weight: 1,
    arbitrary: fc.record({kind: fc.constant('disconnect' as const), client: clientArbitrary}),
  },
  {
    weight: 1,
    arbitrary: fc.record({
      kind: fc.constant('reconnect' as const),
      client: clientArbitrary,
      resume: fc.boolean(),
    }),
  },
  {
    weight: 1,
    arbitrary: fc.record({
      kind: fc.constant('advance' as const),
      ms: fc.constantFrom(10, 500, 5_000, 31_000),
    }),
  },
)

export type Start = 'draft' | 'published-only'

export interface GeneratedCase {
  start: Start
  intents: Intent[]
}

export function intentsArbitrary(maxLength: number): fc.Arbitrary<Intent[]> {
  return fc.array(intentArbitrary, {minLength: 1, maxLength})
}

// The pair seam patches the draft directly, so only the form's path can start from a published document alone.
export function caseArbitrary(
  maxLength: number,
  seam: SyncTestDefinition['seam'],
): fc.Arbitrary<GeneratedCase> {
  const start =
    seam === 'operations'
      ? fc.constantFrom<Start>('draft', 'published-only')
      : fc.constant<Start>('draft')
  return fc.record({start, intents: intentsArbitrary(maxLength)})
}

function item(key: string, title: string = key.toUpperCase()) {
  return {_key: key, _type: 'item', title}
}

function initialKeysOf(start: Start): string[] {
  return start === 'draft' ? INITIAL_KEYS : []
}

function initialDocuments(start: Start): SanityDocument[] {
  const system = {
    _type: 'article',
    _rev: 'seed',
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: '2026-01-01T00:00:00.000Z',
  }
  const published = {...system, _id: PUBLISHED_ID, title: 'published'}
  const draft = {
    ...system,
    _id: DRAFT_ID,
    title: 'draft',
    [FIELD]: INITIAL_KEYS.map((key) => item(key)),
  }
  return start === 'draft' ? [published, draft] : [published]
}

function keyPath(key: string): string {
  return `${FIELD}[_key=="${key}"]`
}

function appendItem(key: string): RawPatch[] {
  return [{setIfMissing: {[FIELD]: []}}, {insert: {after: `${FIELD}[-1]`, items: [item(key)]}}]
}

function toPatches(edit: Edit, key: string): RawPatch[] {
  switch (edit.type) {
    case 'setTitle':
      return [{set: {title: edit.title}}]
    case 'unsetTitle':
      return [{unset: ['title']}]
    case 'insertItem':
      return appendItem(key)
    case 'unsetItem':
      return [{unset: [keyPath(key)]}]
    case 'renameItem':
      return [{set: {[`${keyPath(key)}.title`]: edit.title}}]
    case 'moveItem':
      return [{unset: [keyPath(key)]}, ...appendItem(key)]
    default:
      throw new Error(`Unknown edit ${JSON.stringify(edit)}`)
  }
}

function touchType(edit: Edit): KeyTouch['type'] | undefined {
  if (edit.type === 'insertItem') return 'insert'
  if (edit.type === 'unsetItem') return 'unset'
  if (edit.type === 'moveItem') return 'move'
  return undefined
}

function isPendingCommitMissing(error: unknown): boolean {
  return error instanceof Error && error.message.startsWith('No pending commit')
}

interface Builder extends KeyHistory {
  steps: Step[]
  insertedCount: number
  droppedEvent: boolean
  clients: Record<ClientId, ClientState>
}

class StepFailureError extends Error {
  readonly step: Step

  constructor(step: Step, cause: unknown) {
    super(messageOf(cause), {cause})
    this.name = 'StepFailureError'
    this.step = step
  }
}

async function runStep(builder: Builder, step: Step): Promise<void> {
  try {
    await runSteps(builder.world, [step])
  } catch (error) {
    throw new StepFailureError(step, error)
  }
}

async function apply(builder: Builder, step: Step): Promise<void> {
  builder.steps.push(step)
  await runStep(builder, step)
}

async function tryApply(builder: Builder, step: Step): Promise<boolean> {
  try {
    await runStep(builder, step)
  } catch (error) {
    if (error instanceof StepFailureError && isPendingCommitMissing(error.cause)) return false
    throw error
  }
  builder.steps.push(step)
  return true
}

function visibleKeys(builder: Builder, actor: Actor): string[] {
  const document =
    actor === 'outside'
      ? builder.world.lake.get(DRAFT_ID)
      : builder.world.clients[actor].localDocument(DRAFT_ID)
  return keysOf(document, FIELD)
}

function resolveKey(builder: Builder, actor: Actor, edit: Edit): string | undefined {
  if (edit.type === 'insertItem') {
    builder.insertedCount += 1
    return `k${builder.insertedCount}`
  }
  if ('keyIndex' in edit) {
    const keys = visibleKeys(builder, actor)
    return keys.length === 0 ? undefined : keys[edit.keyIndex % keys.length]
  }
  return ''
}

async function applyEdit(builder: Builder, actor: Actor, edit: Edit): Promise<void> {
  if (actor === 'outside' && builder.world.lake.get(DRAFT_ID) === null) return
  const key = resolveKey(builder, actor, edit)
  if (key === undefined) return
  const patches = toPatches(edit, key)
  if (actor === 'outside') {
    const mutations = patches.map((patch) => ({patch: {id: DRAFT_ID, ...patch}}))
    await apply(builder, {do: 'outside', mutations: mutations as MutationPayload[]})
  } else {
    await apply(builder, {client: actor, do: 'patch', id: DRAFT_ID, patches})
  }
  recordTouch(builder, actor, edit, key)
}

function recordTouch(builder: Builder, actor: Actor, edit: Edit, key: string): void {
  const type = touchType(edit)
  if (type === undefined) return
  const record = actor === 'outside' ? undefined : builder.world.edits.at(-1)
  builder.touches.push(record ? {key, type, edit: record} : {key, type})
}

async function applyIntent(builder: Builder, intent: Intent): Promise<void> {
  if (intent.kind === 'advance') return apply(builder, {do: 'advance', ms: intent.ms})
  if (intent.kind === 'outside') return applyEdit(builder, 'outside', intent.edit)
  const {client} = intent
  const state = builder.clients[client]
  switch (intent.kind) {
    case 'edit':
      return applyEdit(builder, client, intent.edit)
    case 'commit':
      return apply(builder, {client, do: 'commit'})
    case 'commits':
      if (state.commits === intent.mode) return undefined
      state.commits = intent.mode
      return apply(builder, {client, do: 'commits', mode: intent.mode})
    case 'settleCommit':
      if (state.commits === 'auto') return undefined
      await tryApply(
        builder,
        intent.outcome === 'accept'
          ? {client, do: 'acceptCommit'}
          : {client, do: 'rejectCommit', statusCode: intent.outcome},
      )
      return undefined
    case 'listener':
      if (state.listener === intent.mode) return undefined
      state.listener = intent.mode
      if (intent.mode === 'hold') state.heldEvents = 'maybe'
      return apply(builder, {client, do: 'listener', mode: intent.mode})
    case 'releaseEvents':
      if (state.connection === 'up' && state.heldEvents === 'maybe') {
        const all = intent.count === undefined
        if (all && state.listener === 'auto') state.heldEvents = 'none'
        return apply(builder, {
          client,
          do: 'releaseEvents',
          ...(all ? {} : {count: intent.count}),
          ...(intent.order === 'reverse' ? {order: 'reverse' as const} : {}),
        })
      }
      return undefined
    case 'dropEvent':
      if (state.connection === 'up' && state.heldEvents === 'maybe') {
        builder.droppedEvent = true
        return apply(builder, {client, do: 'dropEvent'})
      }
      return undefined
    case 'disconnect':
      if (state.connection === 'up' && state.listener === 'auto' && state.heldEvents === 'none') {
        state.connection = 'down'
        return apply(builder, {client, do: 'disconnect'})
      }
      return undefined
    case 'reconnect':
      if (state.connection === 'up') return undefined
      state.connection = 'up'
      return apply(builder, {client, do: 'reconnect', resume: intent.resume})
    default:
      throw new Error(`Unknown intent ${JSON.stringify(intent)}`)
  }
}

async function acceptPending(builder: Builder, client: ClientId, remaining: number): Promise<void> {
  if (remaining === 0) return
  const accepted = await tryApply(builder, {client, do: 'acceptCommit'})
  if (accepted) await acceptPending(builder, client, remaining - 1)
}

async function sequence<T>(
  items: readonly T[],
  action: (value: T) => Promise<void>,
): Promise<void> {
  await items.reduce<Promise<void>>(
    (previous, value) => previous.then(() => action(value)),
    Promise.resolve(),
  )
}

async function restoreClient(builder: Builder, client: ClientId): Promise<void> {
  const state = builder.clients[client]
  if (state.connection === 'down')
    await applyIntent(builder, {kind: 'reconnect', client, resume: true})
  await applyIntent(builder, {kind: 'listener', client, mode: 'auto'})
  await applyIntent(builder, {kind: 'releaseEvents', client, order: 'fifo'})
  await applyIntent(builder, {kind: 'commits', client, mode: 'auto'})
  await acceptPending(builder, client, MAX_PENDING_ACCEPTS)
}

function messageOf(reason: unknown): string {
  return reason instanceof Error ? reason.message : String(reason)
}

export type Rule =
  | 'converged'
  | 'revisions'
  | 'healthy'
  | 'keys'
  | 'lost-edits'
  | 'unhandled-rejections'
  | 'settle'
  | 'step'

export interface SignatureFields {
  rule: Rule
  check?: string
  detail?: string
  fate?: LostEditFateKind
  statusCode?: number
  errorType?: string
  operation?: string
  thrownBy?: string
}

export interface SubmissionReport {
  clientId: string
  transactionId: string
  request:
    | {kind: 'actions'; actions: unknown[]}
    | {kind: 'mutations'; mutations: unknown[]}
    | {kind: 'outside'; mutations: unknown[]}
  injected: boolean
  outcome: SubmissionRecord['outcome']
  statusCode?: number
  responseBody?: unknown
  settledAt?: number
}

export interface RunFailure {
  signature: string
  signatureFields: SignatureFields
  message: string
  definition: SyncTestDefinition
  submissions: SubmissionReport[]
}

export class GeneratedRunError extends Error {
  readonly failure: RunFailure

  constructor(failure: RunFailure, cause: unknown) {
    super(failure.message, {cause})
    this.name = 'GeneratedRunError'
    this.failure = failure
  }
}

class RuleFailureError extends Error {
  readonly rule: Rule

  constructor(rule: Rule, cause: unknown) {
    super(messageOf(cause), {cause})
    this.name = 'RuleFailureError'
    this.rule = rule
  }
}

const SIGNATURE_ORDER = [
  'rule',
  'check',
  'detail',
  'fate',
  'statusCode',
  'errorType',
  'operation',
  'thrownBy',
] as const
const DOCUMENT_KINDS = [
  ['draft', DRAFT_ID],
  ['published', PUBLISHED_ID],
] as const
const SYSTEM_FIELDS = new Set(['_rev', '_updatedAt', '_createdAt'])
const PATCH_FIELDS_THAT_ARE_NOT_OPERATIONS = new Set([
  'id',
  'query',
  'ifRevisionID',
  'unsetIsEmpty',
])

export function signatureOf(fields: SignatureFields): string {
  return SIGNATURE_ORDER.flatMap((name) => {
    const value = fields[name]
    return value === undefined ? [] : [String(value)]
  }).join(' | ')
}

function withoutUndefined<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T
}

function operationOf(mutation: MutationPayload | undefined): string | undefined {
  if (mutation === undefined) return undefined
  const fields = mutation.patch
    ? without(Object.keys(mutation.patch), PATCH_FIELDS_THAT_ARE_NOT_OPERATIONS)
    : Object.keys(mutation)
  return fields.toSorted().join('+')
}

function failedMutationIndex(submission: SubmissionRecord): number | undefined {
  const body = submission.responseBody as {error?: {items?: Array<{index?: number}>}} | undefined
  return body?.error?.items?.[0]?.index
}

function failingOperation(submission: SubmissionRecord): string | undefined {
  const index = failedMutationIndex(submission)
  return index === undefined ? undefined : operationOf(submission.mutations[index])
}

function rejectionFields(submission: SubmissionRecord): Partial<SignatureFields> {
  return {
    statusCode: submission.statusCode,
    errorType: submission.errorType,
    operation: failingOperation(submission),
  }
}

function statusCodeOf(error: unknown): number | undefined {
  const statusCode = (error as {statusCode?: unknown} | null)?.statusCode
  return typeof statusCode === 'number' ? statusCode : undefined
}

function contentLakeErrorTypeOf(error: unknown): string | undefined {
  const body = (error as {response?: {body?: {error?: {type?: unknown}}}} | null)?.response?.body
  const type = body?.error?.type
  return typeof type === 'string' ? type : undefined
}

function errorTypeOf(error: unknown): string {
  return contentLakeErrorTypeOf(error) ?? (error instanceof Error ? error.name : typeof error)
}

const STACK_FRAME = /^\s+at (?:async )?(?:(\S+) \()?(.*?):\d+:\d+\)?$/m

// An engine error carries no error type of its own, so the function that threw tells one apart from another.
function throwSiteOf(error: unknown): string | undefined {
  const frame = error instanceof Error ? error.stack?.match(STACK_FRAME) : undefined
  if (frame === undefined || frame === null) return undefined
  const [, functionName, file] = frame
  return functionName ?? file.split('/').at(-1)
}

function errorFields(world: World, error: unknown): Partial<SignatureFields> {
  const submission = world.lake.submissions.find((candidate) => candidate.error === error)
  if (submission) return rejectionFields(submission)
  const contentLakeType = contentLakeErrorTypeOf(error)
  return {
    statusCode: statusCodeOf(error),
    errorType: contentLakeType ?? errorTypeOf(error),
    thrownBy: contentLakeType === undefined ? throwSiteOf(error) : undefined,
  }
}

function streamErrorsOf(world: World): unknown[] {
  return CLIENTS.flatMap((client) => world.clients[client].errors())
}

function streamErrorFields(world: World): Partial<SignatureFields> {
  const [streamError] = streamErrorsOf(world)
  return streamError === undefined
    ? {}
    : {check: 'stream-errors', ...errorFields(world, streamError)}
}

function lostEditFields(world: World): Partial<SignatureFields> {
  const [lost] = lostEdits(world)
  if (lost === undefined) return {}
  const rejection = lost.rejection ? rejectionFields(lost.rejection) : {}
  return {fate: lost.fateKind, ...rejection}
}

function differingFields(local: SanityDocument | null, server: SanityDocument | null): string[] {
  if (local === null || server === null) return local === server ? [] : ['document']
  const names = without(new Set([...Object.keys(local), ...Object.keys(server)]), SYSTEM_FIELDS)
  return names.flatMap((name) => (isDeepStrictEqual(local[name], server[name]) ? [] : [name]))
}

function revisionMismatch(local: SanityDocument | null, server: SanityDocument | null): string[] {
  if (local?._rev === server?._rev) return []
  if (local === null) return ['local-missing']
  return server === null ? ['server-missing'] : ['stale']
}

function perDocumentKind(
  world: World,
  compare: (local: SanityDocument | null, server: SanityDocument | null) => string[],
): Partial<SignatureFields> {
  const differences = DOCUMENT_KINDS.flatMap(([kind, id]) => {
    const found = new Set(
      CLIENTS.flatMap((client) =>
        compare(world.clients[client].localDocument(id), world.lake.get(id)),
      ),
    )
    return found.size === 0 ? [] : [{kind, found: [...found].toSorted().join(',')}]
  })
  if (differences.length === 0) return {}
  return {
    check: differences.map(({kind}) => kind).join('+'),
    detail: differences.map(({found}) => found).join(';'),
  }
}

// What the stuck client last did with its edits, which tells a commit that never left apart from one that went unanswered.
function saveStateOf(world: World, client: string): string {
  const lastEdit = world.edits.findLast((edit) => edit.client === client)
  if (lastEdit === undefined) return 'no-edit'
  const lastSave = world.lake.submissions.findLast(
    (submission) => submission.clientId === client && submission.submittedAt >= lastEdit.at,
  )
  if (lastSave === undefined) return 'nothing-sent'
  return lastSave.outcome === 'rejected' ? `rejected-${lastSave.statusCode}` : lastSave.outcome
}

function stuckFields(world: World): Partial<SignatureFields> {
  const consistent = new Set(CLIENTS.filter((client) => world.clients[client].consistent()))
  const [inconsistent] = without(CLIENTS, consistent)
  if (inconsistent) return {check: 'consistent', detail: saveStateOf(world, inconsistent)}
  const locked = CLIENTS.find((client) => world.clients[client].transactionLocked())
  return locked ? {check: 'transaction-lock', detail: saveStateOf(world, locked)} : {}
}

function healthFields(world: World): Partial<SignatureFields> {
  const streamErrors = streamErrorFields(world)
  return streamErrors.check ? streamErrors : stuckFields(world)
}

function settleFields(world: World): Partial<SignatureFields> {
  const streamErrors = streamErrorFields(world)
  if (streamErrors.check) return streamErrors
  const stuck = stuckFields(world)
  return stuck.check ? stuck : {check: 'busy'}
}

function keyFields(builder: Builder): Partial<SignatureFields> {
  const {serverKeys, actual, expected} = keyExpectation(builder)
  if (new Set(serverKeys).size < serverKeys.length) return {detail: 'duplicate'}
  const missing = without(expected, new Set(actual)).length > 0 ? ['missing'] : []
  const unexpected = without(actual, new Set(expected)).length > 0 ? ['unexpected'] : []
  return {detail: [...missing, ...unexpected].join('+')}
}

function signatureFieldsOf(
  error: unknown,
  builder: Builder,
  unhandled: UnhandledRejections,
): SignatureFields {
  const {world} = builder
  if (error instanceof StepFailureError) {
    if (error.step.do === 'settle') return {rule: 'settle', ...settleFields(world)}
    return {rule: 'step', check: error.step.do, ...errorFields(world, error.cause)}
  }
  const rule = error instanceof RuleFailureError ? error.rule : 'step'
  switch (rule) {
    case 'unhandled-rejections':
      return {rule, ...errorFields(world, unhandled.reasons[0])}
    case 'healthy':
      return {rule, ...healthFields(world)}
    case 'converged':
      return {rule, ...perDocumentKind(world, differingFields)}
    case 'revisions':
      return {rule, ...perDocumentKind(world, revisionMismatch)}
    case 'keys':
      return {rule, ...keyFields(builder)}
    case 'lost-edits':
      return {rule, ...lostEditFields(world)}
    default:
      return {rule}
  }
}

function outsideOutcome(world: World, transactionId: string): SubmissionReport['outcome'] {
  const applied = world.lake.transactions.some((record) => record.transactionId === transactionId)
  return applied ? 'accepted' : 'rejected'
}

function submissionReport(submission: SubmissionRecord): SubmissionReport {
  return withoutUndefined({
    clientId: submission.clientId,
    transactionId: submission.transactionId,
    request: submission.request ?? {kind: 'mutations', mutations: submission.mutations},
    injected: submission.injected === true,
    outcome: submission.outcome,
    statusCode: submission.statusCode,
    responseBody: submission.responseBody,
    settledAt: submission.settledAt,
  })
}

function submissionReports(world: World): SubmissionReport[] {
  return world.lake.requests.map((request) =>
    request.kind === 'submission'
      ? submissionReport(request.submission)
      : {
          clientId: 'outside',
          transactionId: request.transactionId,
          request: {kind: 'outside', mutations: request.mutations},
          injected: false,
          outcome: outsideOutcome(world, request.transactionId),
          settledAt: request.appliedAt,
        },
  )
}

function humanMessage(error: unknown, world: World, unhandled: UnhandledRejections): string {
  const notes = [...unhandled.reasons, ...streamErrorsOf(world)].map(
    (reason) => `\n  ${errorTypeOf(reason)}: ${messageOf(reason)}`,
  )
  const step = error instanceof StepFailureError ? ` (during ${JSON.stringify(error.step)})` : ''
  return `${messageOf(error)}${step}${notes.join('')}`
}

function describeFailure(
  error: unknown,
  builder: Builder,
  definition: SyncTestDefinition,
  unhandled: UnhandledRejections,
): RunFailure {
  const {world} = builder
  const signatureFields = withoutUndefined(signatureFieldsOf(error, builder, unhandled))
  return {
    signature: signatureOf(signatureFields),
    signatureFields,
    message: humanMessage(error, world, unhandled),
    definition: structuredClone(definition),
    submissions: structuredClone(submissionReports(world)),
  }
}

function checkRule(rule: Rule, check: () => void): void {
  try {
    check()
  } catch (error) {
    throw new RuleFailureError(rule, error)
  }
}

function checkRules(builder: Builder, unhandled: UnhandledRejections): void {
  const {world} = builder
  checkRule('unhandled-rejections', () =>
    expect(unhandled.reasons.map(messageOf), 'unhandled rejections').toEqual([]),
  )
  checkRule('healthy', () => expectHealthy(world))
  checkRule('converged', () => expectConverged(world))
  checkRule('revisions', () => expectRevisionsAgree(world))
  checkRule('keys', () => expectGeneratedKeys(builder))
  checkRule('lost-edits', () => expectNoLostEdits(world))
}

function createDefinition(seam: SyncTestDefinition['seam'], start: Start): SyncTestDefinition {
  return {
    id: 'GEN',
    title: 'Generated sequence',
    seam,
    initial: initialDocuments(start),
    idPair: {publishedId: PUBLISHED_ID, draftId: DRAFT_ID},
    clients: [...CLIENTS],
    steps: [],
  }
}

function createBuilder(world: World, definition: SyncTestDefinition, start: Start): Builder {
  return {
    world,
    steps: definition.steps,
    initialKeys: initialKeysOf(start),
    touches: [],
    insertedCount: 0,
    droppedEvent: false,
    clients: {
      A: {commits: 'auto', listener: 'auto', connection: 'up', heldEvents: 'none'},
      B: {commits: 'auto', listener: 'auto', connection: 'up', heldEvents: 'none'},
    },
  }
}

// A dropped event only shows once a later event fails to chain, and recovery waits for the chain deadline.
function afterDroppedEvent(builder: Builder): Step[] {
  const advance: Step = {do: 'advance', ms: 31_000}
  if (builder.world.lake.get(DRAFT_ID) === null) return [advance]
  return [{do: 'outside', mutations: [{patch: {id: DRAFT_ID, set: {afterDrop: true}}}]}, advance]
}

async function buildAndCheck(
  builder: Builder,
  intents: Intent[],
  unhandled: UnhandledRejections,
): Promise<void> {
  await sequence(intents, (intent) => applyIntent(builder, intent))
  await sequence(CLIENTS, (client) => restoreClient(builder, client))
  await sequence(CLIENTS, (client) => apply(builder, {client, do: 'commit'}))
  if (builder.droppedEvent)
    await sequence(afterDroppedEvent(builder), (step) => apply(builder, step))
  await apply(builder, {do: 'settle'})
  checkRules(builder, unhandled)
}

export interface PassingRun {
  definition: SyncTestDefinition
  submissions: SubmissionReport[]
}

async function runInWorld(
  {start, intents}: GeneratedCase,
  definition: SyncTestDefinition,
  unhandled: UnhandledRejections,
  keep: boolean,
): Promise<PassingRun | undefined> {
  const world = await createWorld(definition, {schema: articleSchema, typeName: 'article'})
  const builder = createBuilder(world, definition, start)
  try {
    await buildAndCheck(builder, intents, unhandled)
  } catch (error) {
    throw new GeneratedRunError(describeFailure(error, builder, definition, unhandled), error)
  } finally {
    world.teardown()
  }
  if (keep) {
    return {
      definition: structuredClone(definition),
      submissions: structuredClone(submissionReports(world)),
    }
  }
  return undefined
}

/** Throws a GeneratedRunError when a rule breaks; with `keep`, returns the passing run for sampling. */
export async function checkCase(
  generatedCase: GeneratedCase,
  seam: SyncTestDefinition['seam'],
  keep = false,
): Promise<PassingRun | undefined> {
  const unhandled = captureUnhandledRejections()
  try {
    return await runInWorld(
      generatedCase,
      createDefinition(seam, generatedCase.start),
      unhandled,
      keep,
    )
  } finally {
    unhandled.stop()
  }
}

function requestOperations(request: SubmissionReport['request']): string[] {
  if (request.kind === 'actions') {
    return (request.actions as Array<{actionType: string; patch?: Record<string, unknown>}>).map(
      (action) =>
        action.patch
          ? without(Object.keys(action.patch), PATCH_FIELDS_THAT_ARE_NOT_OPERATIONS)
              .toSorted()
              .join('+')
          : action.actionType,
    )
  }
  return (request.mutations as MutationPayload[]).map((mutation) => operationOf(mutation) ?? '')
}

/** The ordered request kinds and operation sets of a run, which tells two samples apart. */
export function requestShapeOf(submissions: SubmissionReport[]): string {
  return submissions
    .map(({request}) => `${request.kind}:${requestOperations(request).join(',')}`)
    .join(' ; ')
}

// A key is unsure when an injected 4xx may have discarded one of its touches, or when a move races an unset.
function unsureKeys(world: World, touches: KeyTouch[]): Set<string> {
  const touchesByKey = touches.reduce((byKey, touch) => {
    byKey.set(touch.key, [...(byKey.get(touch.key) ?? []), touch])
    return byKey
  }, new Map<string, KeyTouch[]>())
  return new Set(
    [...touchesByKey].flatMap(([key, keyTouches]) => {
      const types = new Set(keyTouches.map((touch) => touch.type))
      const discarded = keyTouches.some(
        (touch) => touch.edit !== undefined && wasDiscardedOnPurpose(touch.edit, world),
      )
      const moveRacesUnset = types.has('unset') && types.has('move')
      return discarded || moveRacesUnset ? [key] : []
    }),
  )
}

function touchedKeys(touches: KeyTouch[], type: KeyTouch['type']): Set<string> {
  return new Set(touches.flatMap((touch) => (touch.type === type ? [touch.key] : [])))
}

function without(keys: Iterable<string>, excluded: Set<string>): string[] {
  return [...keys].flatMap((key) => (excluded.has(key) ? [] : [key]))
}

interface KeyExpectation {
  serverKeys: string[]
  initial: string[]
  actual: string[]
  expected: string[]
  added: string[]
  removed: string[]
}

function keyExpectation({world, touches, initialKeys}: KeyHistory): KeyExpectation {
  const serverKeys = keysOf(world.lake.get(DRAFT_ID), FIELD)
  const unsure = unsureKeys(world, touches)
  const unset = touchedKeys(touches, 'unset')
  const initial = without(initialKeys, unsure)
  const added = without(without(touchedKeys(touches, 'insert'), unsure), unset)
  const removed = initial.filter((key) => unset.has(key))
  const expected = [...without(initial, new Set(removed)), ...added]
  return {serverKeys, initial, actual: without(serverKeys, unsure), expected, added, removed}
}

/** Every array key on the server is one the history accounts for, and none is duplicated. */
export function expectGeneratedKeys(history: KeyHistory): void {
  const {serverKeys, initial, actual, added, removed} = keyExpectation(history)
  expect(new Set(serverKeys).size, 'duplicate keys').toBe(serverKeys.length)
  expectKeysConserved(initial, actual, {added, removed})
}

export function printDefinition(definition: SyncTestDefinition, id: string, title: string): string {
  const literal = JSON.stringify({...definition, id, title}, null, 2)
  return `const syncTest: SyncTestDefinition = ${literal.replace(/"(\w+)":/g, '$1:')}`
}
