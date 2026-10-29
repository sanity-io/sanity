import {type Action, ClientError} from '@sanity/client'
import {type SanityDocument} from '@sanity/types'
import {Observable} from 'rxjs'

import {type MutationPayload} from '../../src/core/store/document/buffered-doc/types'
import {
  type MutationEvent,
  type ReconnectEvent,
  type ResetEvent,
  type WelcomeBackEvent,
  type WelcomeEvent,
} from '../../src/core/store/document/types'
import {applyMutations, type DocumentIndex} from './referenceApplier'

export type RawListenerEvent =
  | WelcomeEvent
  | MutationEvent
  | ReconnectEvent
  | ResetEvent
  | WelcomeBackEvent

export interface CommitPolicy {
  mode: 'auto' | 'hold'
  latencyMs: number
}

export interface ListenerPolicy {
  mode: 'auto' | 'hold'
  latencyMs: number
}

export interface TransactionRecord {
  transactionId: string
  identity: string
  mutations: MutationPayload[]
  events: MutationEvent[]
}

interface PendingCommit {
  transactionId: string
  mutations: MutationPayload[]
  resolve: (result: unknown) => void
  reject: (error: unknown) => void
}

interface Connection {
  clientId: string
  ids: Set<string>
  emit: (event: RawListenerEvent) => void
  held: MutationEvent[]
  missedWhileDisconnected: MutationEvent[]
  disconnected: boolean
  flushScheduled: boolean
  queued: MutationEvent[]
}

export interface ClientControls {
  commits: CommitPolicy
  listener: ListenerPolicy
  pendingCommits: () => number
  acceptNextCommit: () => void
  rejectNextCommit: (statusCode: number, description?: string) => void
  heldEvents: () => number
  releaseHeldEvents: (options?: {count?: number; order?: 'fifo' | 'reverse'}) => void
  dropNextHeldEvent: () => void
  disconnect: () => void
  reconnect: (options: {resume: boolean}) => void
}

const SEED_TIMESTAMP = '2026-01-01T00:00:00.000Z'

function httpError(statusCode: number, description: string): ClientError {
  return new ClientError({
    statusCode,
    headers: {},
    method: 'POST',
    url: 'fake://content-lake/data/actions',
    body: {error: {type: 'mutationError', description, items: []}},
  })
}

function targetIdOf(mutation: MutationPayload): string {
  const id =
    mutation.patch?.id ??
    mutation.delete?.id ??
    mutation.create?._id ??
    mutation.createIfNotExists?._id ??
    mutation.createOrReplace?._id
  if (typeof id === 'string') return id
  throw httpError(400, `Cannot determine target document of ${JSON.stringify(mutation)}`)
}

function stripSystemFields(
  document: SanityDocument,
): Omit<SanityDocument, '_rev' | '_updatedAt' | '_createdAt'> {
  const {_rev, _updatedAt, _createdAt, ...rest} = document
  return rest
}

function revisionConflicts(expected: string | undefined, actual: string | undefined): boolean {
  return expected !== undefined && actual !== expected
}

function transitionOf(
  previous: SanityDocument | undefined,
  next: SanityDocument | undefined,
): MutationEvent['transition'] {
  if (previous && next) return 'update'
  return next ? 'appear' : 'disappear'
}

export class FakeContentLake {
  private documents: DocumentIndex = {}
  private connections = new Set<Connection>()
  private pendingCommits = new Map<string, PendingCommit[]>()
  private controls = new Map<string, ClientControls>()
  private welcomeCounter = 0
  readonly transactions: TransactionRecord[] = []
  readonly rejectedCommits: Array<{clientId: string; transactionId: string; statusCode: number}> =
    []

  constructor(initialDocuments: SanityDocument[] = []) {
    initialDocuments.forEach((seed) => {
      const {
        _createdAt = SEED_TIMESTAMP,
        _updatedAt = SEED_TIMESTAMP,
        _rev = 'seed',
        ...rest
      } = seed
      this.documents[seed._id] = {...rest, _createdAt, _updatedAt, _rev}
    })
  }

  get(id: string): SanityDocument | null {
    return this.documents[id] ?? null
  }

  content(id: string): ReturnType<typeof stripSystemFields> | null {
    const document = this.get(id)
    return document ? stripSystemFields(document) : null
  }

  client(clientId: string): ClientControls {
    const existing = this.controls.get(clientId)
    if (existing) return existing
    const controls: ClientControls = {
      commits: {mode: 'auto', latencyMs: 0},
      listener: {mode: 'auto', latencyMs: 0},
      pendingCommits: () => this.pendingFor(clientId).length,
      acceptNextCommit: () => this.settleNextCommit(clientId, undefined),
      rejectNextCommit: (statusCode, description = `Rejected with ${statusCode}`) =>
        this.settleNextCommit(clientId, httpError(statusCode, description)),
      heldEvents: () =>
        this.connectionsOf(clientId).reduce((sum, connection) => sum + connection.held.length, 0),
      releaseHeldEvents: (options) => this.releaseHeld(clientId, options),
      dropNextHeldEvent: () =>
        this.connectionsOf(clientId).forEach((connection) => connection.held.shift()),
      disconnect: () => this.disconnect(clientId),
      reconnect: (options) => this.reconnect(clientId, options),
    }
    this.controls.set(clientId, controls)
    return controls
  }

  mutateFromOutside(
    mutations: MutationPayload[],
    transactionId = `ext-${this.transactions.length + 1}`,
  ): void {
    this.applyTransaction(mutations, transactionId, 'outside')
  }

  submitActions(clientId: string, actions: Action[], transactionId: string): Promise<unknown> {
    return this.submit(clientId, transactionId, () => this.actionsToMutations(actions))
  }

  submitMutations(
    clientId: string,
    mutations: MutationPayload[],
    transactionId: string,
  ): Promise<unknown> {
    return this.submit(clientId, transactionId, () => mutations)
  }

  getDocuments(ids: string[]): Array<SanityDocument | null> {
    return ids.map((id) => structuredClone(this.get(id)))
  }

  listen(clientId: string, ids: string[]): Observable<RawListenerEvent> {
    return new Observable<RawListenerEvent>((subscriber) => {
      const connection: Connection = {
        clientId,
        ids: new Set(ids),
        emit: (event) => subscriber.next(event),
        held: [],
        missedWhileDisconnected: [],
        disconnected: false,
        flushScheduled: false,
        queued: [],
      }
      this.connections.add(connection)
      this.welcomeCounter += 1
      const welcomeTimer = setTimeout(() => {
        subscriber.next({type: 'welcome', listenerName: `fake-listener-${this.welcomeCounter}`})
      }, 0)
      return () => {
        clearTimeout(welcomeTimer)
        this.connections.delete(connection)
      }
    })
  }

  private pendingFor(clientId: string): PendingCommit[] {
    const existing = this.pendingCommits.get(clientId)
    if (existing) return existing
    const created: PendingCommit[] = []
    this.pendingCommits.set(clientId, created)
    return created
  }

  private connectionsOf(clientId: string): Connection[] {
    return [...this.connections].filter((connection) => connection.clientId === clientId)
  }

  private submit(
    clientId: string,
    transactionId: string,
    toMutations: () => MutationPayload[],
  ): Promise<unknown> {
    const policy = this.client(clientId).commits
    return new Promise((resolve, reject) => {
      const pending: PendingCommit = {transactionId, mutations: [], resolve, reject}
      try {
        pending.mutations = toMutations()
      } catch (error) {
        reject(error)
        return
      }
      this.pendingFor(clientId).push(pending)
      if (policy.mode === 'auto') {
        setTimeout(() => {
          if (this.pendingFor(clientId).includes(pending)) {
            this.settleCommit(clientId, pending, undefined)
          }
        }, policy.latencyMs)
      }
    })
  }

  private settleNextCommit(clientId: string, rejection: ClientError | undefined): void {
    const next = this.pendingFor(clientId)[0]
    if (next === undefined) throw new Error(`No pending commit for client ${clientId}`)
    this.settleCommit(clientId, next, rejection)
  }

  private settleCommit(
    clientId: string,
    pending: PendingCommit,
    rejection: ClientError | undefined,
  ): void {
    const queue = this.pendingFor(clientId)
    queue.splice(queue.indexOf(pending), 1)
    if (rejection) {
      this.rejectedCommits.push({
        clientId,
        transactionId: pending.transactionId,
        statusCode: rejection.statusCode,
      })
      pending.reject(rejection)
      return
    }
    try {
      const record = this.applyTransaction(pending.mutations, pending.transactionId, clientId)
      pending.resolve({
        transactionId: record.transactionId,
        results: record.events.map((event) => ({id: event.documentId, operation: 'update'})),
      })
    } catch (error) {
      const failure = error instanceof ClientError ? error : httpError(400, String(error))
      this.rejectedCommits.push({
        clientId,
        transactionId: pending.transactionId,
        statusCode: failure.statusCode,
      })
      pending.reject(failure)
    }
  }

  private actionsToMutations(actions: Action[]): MutationPayload[] {
    return actions.flatMap((action): MutationPayload[] => {
      switch (action.actionType) {
        case 'sanity.action.document.edit': {
          const draft = this.get(action.draftId)
          const published = this.get(action.publishedId)
          if (draft === null && published === null) {
            throw httpError(404, `Neither ${action.draftId} nor ${action.publishedId} exists`)
          }
          const materialise: MutationPayload[] =
            draft === null && published
              ? [{createIfNotExists: {...stripSystemFields(published), _id: action.draftId}}]
              : []
          return [...materialise, {patch: {id: action.draftId, ...action.patch}}]
        }
        case 'sanity.action.document.create': {
          const id = action.attributes._id
          if (this.get(id) && action.ifExists === 'fail') {
            throw httpError(409, `Document ${id} already exists`)
          }
          return [{createIfNotExists: action.attributes}]
        }
        case 'sanity.action.document.publish': {
          const draft = this.get(action.draftId)
          const published = this.get(action.publishedId)
          if (draft === null) throw httpError(404, `Draft ${action.draftId} does not exist`)
          if (revisionConflicts(action.ifPublishedRevisionId, published?._rev)) {
            throw httpError(409, `Published revision mismatch`)
          }
          return [
            {createOrReplace: {...stripSystemFields(draft), _id: action.publishedId}},
            {delete: {id: action.draftId}},
          ]
        }
        case 'sanity.action.document.version.discard':
          return [{delete: {id: action.versionId}}]
        case 'sanity.action.document.unpublish': {
          const published = this.get(action.publishedId)
          if (published === null) {
            throw httpError(404, `Published ${action.publishedId} does not exist`)
          }
          return [
            {createIfNotExists: {...stripSystemFields(published), _id: action.draftId}},
            {delete: {id: action.publishedId}},
          ]
        }
        case 'sanity.action.document.delete':
          return [action.publishedId, ...(action.includeDrafts ?? [])].map((id) => ({
            delete: {id},
          }))
        default:
          throw httpError(400, `Unsupported action type ${action.actionType}`)
      }
    })
  }

  private applyTransaction(
    mutations: MutationPayload[],
    transactionId: string,
    identity: string,
  ): TransactionRecord {
    const timestamp = new Date().toISOString()
    mutations.forEach(({patch}) => {
      if (patch && revisionConflicts(patch.ifRevisionID, this.get(patch.id)?._rev)) {
        throw httpError(409, `Revision mismatch for ${patch.id}`)
      }
    })
    const before = this.documents
    const after = applyMutations(before, mutations)
    const touched = [...new Set(mutations.map(targetIdOf))]
    const affected = touched.filter(
      (id) => JSON.stringify(before[id] ?? null) !== JSON.stringify(after[id] ?? null),
    )
    const events = affected.map((id, index): MutationEvent => {
      const previous = before[id]
      const next = after[id]
      return {
        type: 'mutation',
        documentId: id,
        transactionId,
        mutations: mutations.filter((mutation) => targetIdOf(mutation) === id),
        effects: {apply: [0, next ?? null], revert: [0, previous ?? null]},
        previousRev: previous?._rev as string,
        resultRev: transactionId,
        transactionTotalEvents: affected.length,
        transactionCurrentEvent: index + 1,
        messageReceivedAt: timestamp,
        visibility: 'transaction',
        transition: transitionOf(previous, next),
        timestamp,
        identity,
      } as MutationEvent
    })
    const affectedIds = new Set(affected)
    this.documents = Object.fromEntries(
      Object.entries(after).flatMap(([id, document]) => {
        if (document === undefined || document === null) return []
        const stamped = affectedIds.has(id)
          ? {
              ...document,
              _id: id,
              _rev: transactionId,
              _updatedAt: timestamp,
              _createdAt: document._createdAt ?? timestamp,
            }
          : document
        return [[id, stamped]]
      }),
    )
    const record = {transactionId, identity, mutations, events}
    this.transactions.push(record)
    this.broadcast(events)
    return record
  }

  private broadcast(events: MutationEvent[]): void {
    this.connections.forEach((connection) => {
      const relevant = events.filter((event) => connection.ids.has(event.documentId))
      if (relevant.length === 0) return
      if (connection.disconnected) {
        connection.missedWhileDisconnected.push(...relevant)
        return
      }
      this.deliver(connection, relevant)
    })
  }

  private deliver(connection: Connection, events: MutationEvent[]): void {
    const policy = this.client(connection.clientId).listener
    if (policy.mode === 'hold') {
      connection.held.push(...events)
      return
    }
    connection.queued.push(...events)
    if (connection.flushScheduled) return
    connection.flushScheduled = true
    setTimeout(() => {
      connection.flushScheduled = false
      connection.queued.splice(0).forEach((event) => connection.emit(event))
    }, policy.latencyMs)
  }

  private releaseHeld(
    clientId: string,
    options?: {count?: number; order?: 'fifo' | 'reverse'},
  ): void {
    this.connectionsOf(clientId).forEach((connection) => {
      const count = options?.count ?? connection.held.length
      const batch = connection.held.splice(0, count)
      const ordered = options?.order === 'reverse' ? batch.toReversed() : batch
      ordered.forEach((event) => connection.emit(event))
    })
  }

  private disconnect(clientId: string): void {
    this.connectionsOf(clientId).forEach((connection) => {
      connection.disconnected = true
      connection.emit({type: 'reconnect'})
    })
  }

  private reconnect(clientId: string, options: {resume: boolean}): void {
    this.connectionsOf(clientId).forEach((connection) => {
      connection.disconnected = false
      const missed = connection.missedWhileDisconnected.splice(0)
      if (options.resume) {
        connection.emit({type: 'welcomeback'} as WelcomeBackEvent)
        this.deliver(connection, missed)
        return
      }
      connection.emit({type: 'reset'})
    })
  }
}
