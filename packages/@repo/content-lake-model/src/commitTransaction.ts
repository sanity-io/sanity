import {applyMutations} from './applyMutations'
import {
  ContentLakeError,
  documentAlreadyExists,
  documentNotFound,
  mutationFailed,
  revisionMismatch,
} from './contentLakeError'
import {wholeValueEffects} from './mendoza'
import {
  type CommitResult,
  type ContentLakeDocument,
  type DocumentIndex,
  type MutationEventPayload,
  type MutationPayload,
  type PatchPayload,
} from './types'

export interface CommitInput {
  index: DocumentIndex
  mutations: MutationPayload[]
  transactionId: string
  identity: string
  timestamp: string
}

export interface CommitOutput extends CommitResult {
  index: DocumentIndex
}

interface DocumentChange {
  id: string
  before: ContentLakeDocument | null
  after: ContentLakeDocument | null
}

const OPERATION_BY_TRANSITION = {
  appear: 'create',
  disappear: 'delete',
  update: 'update',
} as const

function targetIdOf(mutation: MutationPayload): string {
  const id =
    mutation.patch?.id ??
    mutation.delete?.id ??
    mutation.create?._id ??
    mutation.createIfNotExists?._id ??
    mutation.createOrReplace?._id
  if (typeof id === 'string') return id
  throw new ContentLakeError(400, {
    description: `Cannot determine target document of ${JSON.stringify(mutation)}`,
    type: 'mutationError',
  })
}

type Presence = ReadonlyMap<string, boolean>

function isPresent(index: DocumentIndex, presence: Presence, id: string): boolean {
  return presence.get(id) ?? id in index
}

function assertRevision(index: DocumentIndex, patch: PatchPayload, position: number): void {
  const current = index[patch.id]?._rev
  const expected = patch.ifRevisionID
  if (expected === undefined || current === expected) return
  throw mutationFailed(409, position, revisionMismatch(patch.id, current, expected))
}

function assertPatchable(
  index: DocumentIndex,
  patch: PatchPayload,
  present: boolean,
  position: number,
): void {
  if (present) return assertRevision(index, patch, position)
  throw mutationFailed(404, position, documentNotFound(patch.id))
}

function presenceAfter(presence: Presence, mutation: MutationPayload, id: string): Presence {
  if (mutation.patch) return presence
  if (mutation.delete) return new Map([...presence, [id, false]])
  return new Map([...presence, [id, true]])
}

// Checked in order, so a patch can target a document created earlier in the same transaction.
function assertPreconditions(index: DocumentIndex, mutations: MutationPayload[]): void {
  mutations.reduce<Presence>((presence, mutation, position) => {
    const id = targetIdOf(mutation)
    const present = isPresent(index, presence, id)
    if (mutation.patch) assertPatchable(index, mutation.patch, present, position)
    if (mutation.create && present) throw mutationFailed(409, position, documentAlreadyExists(id))
    return presenceAfter(presence, mutation, id)
  }, new Map())
}

function transitionOf(change: DocumentChange): MutationEventPayload['transition'] {
  if (change.before && change.after) return 'update'
  return change.after ? 'appear' : 'disappear'
}

function stamp(
  document: ContentLakeDocument,
  id: string,
  transactionId: string,
  timestamp: string,
): ContentLakeDocument {
  return {
    ...document,
    _id: id,
    _rev: transactionId,
    _createdAt: document._createdAt ?? timestamp,
    _updatedAt: timestamp,
  }
}

export function commitTransaction(input: CommitInput): CommitOutput {
  const {index, mutations, transactionId, identity, timestamp} = input
  assertPreconditions(index, mutations)
  const applied = applyMutations(index, mutations)
  const changes = [...new Set(mutations.map(targetIdOf))].flatMap((id): DocumentChange[] => {
    const before = index[id] ?? null
    const after = applied[id] ?? null
    if (before === null && after === null) return []
    return [{id, before, after: after && stamp(after, id, transactionId, timestamp)}]
  })
  const events = changes.map((change, position): MutationEventPayload => ({
    documentId: change.id,
    transactionId,
    identity,
    mutations: mutations.filter((mutation) => targetIdOf(mutation) === change.id),
    effects: wholeValueEffects(change.before, change.after),
    ...(change.before?._rev ? {previousRev: change.before._rev} : {}),
    resultRev: transactionId,
    timestamp,
    transactionTotalEvents: changes.length,
    transactionCurrentEvent: position + 1,
    visibility: 'transaction',
    transition: transitionOf(change),
  }))
  const stamped = Object.fromEntries(
    changes.flatMap(({id, after}) => (after ? [[id, after] as const] : [])),
  )
  return {
    index: {...applied, ...stamped},
    transactionId,
    events,
    results: events.map((event) => ({
      id: event.documentId,
      operation: OPERATION_BY_TRANSITION[event.transition],
    })),
  }
}
