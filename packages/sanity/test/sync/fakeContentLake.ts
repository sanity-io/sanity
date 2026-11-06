import {
  actionsToMutations,
  type CommitResult,
  commitTransaction,
  type ContentLakeAction,
  ContentLakeError,
  type ContentLakeErrorBody,
  type DocumentIndex,
  type MutationEventPayload,
} from '@repo/content-lake-model'
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

export interface SubmissionRecord {
  clientId: string
  transactionId: string
  mutations: MutationPayload[]
  submittedAt: number
  outcome: 'pending' | 'accepted' | 'rejected'
  statusCode?: number
  reason?: string
  injected?: boolean
  settledAt?: number
}

interface PendingCommit {
  transactionId: string
  mutations: MutationPayload[]
  submission: SubmissionRecord
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
  acceptNextCommit: () => void
  rejectNextCommit: (statusCode: number, description?: string) => void
  releaseHeldEvents: (options?: {count?: number; order?: 'fifo' | 'reverse'}) => void
  dropNextHeldEvent: () => void
  disconnect: () => void
  reconnect: (options: {resume: boolean}) => void
}

const SEED_TIMESTAMP = '2026-01-01T00:00:00.000Z'

function httpError(statusCode: number, body: ContentLakeErrorBody): ClientError {
  return new ClientError({
    statusCode,
    headers: {},
    method: 'POST',
    url: 'fake://content-lake/data/actions',
    body: {error: body},
  })
}

function mutationError(description: string): ContentLakeErrorBody {
  return {type: 'mutationError', description, items: []}
}

function toClientError(error: unknown): ClientError {
  if (error instanceof ClientError) return error
  if (error instanceof ContentLakeError) return httpError(error.statusCode, error.body)
  return httpError(400, mutationError(String(error)))
}

function toListenerEvent(event: MutationEventPayload): MutationEvent {
  return {type: 'mutation', ...event, messageReceivedAt: event.timestamp} as MutationEvent
}

function stripSystemFields(
  document: SanityDocument,
): Omit<SanityDocument, '_rev' | '_updatedAt' | '_createdAt'> {
  const {_rev, _updatedAt, _createdAt, ...rest} = document
  return rest
}

export class FakeContentLake {
  private documents: DocumentIndex = {}
  private connections = new Set<Connection>()
  private pendingCommits = new Map<string, PendingCommit[]>()
  private controls = new Map<string, ClientControls>()
  private welcomeCounter = 0
  private ticks = 0
  readonly transactions: TransactionRecord[] = []
  readonly submissions: SubmissionRecord[] = []
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

  /** Counts submissions and settlements, so edits can be ordered against them. */
  get clock(): number {
    return this.ticks
  }

  get(id: string): SanityDocument | null {
    return (this.documents[id] as SanityDocument | undefined) ?? null
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
      acceptNextCommit: () => this.settleNextCommit(clientId, undefined),
      rejectNextCommit: (statusCode, description = `Rejected with ${statusCode}`) =>
        this.settleNextCommit(clientId, httpError(statusCode, mutationError(description))),
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
    return this.submit(clientId, transactionId, () =>
      actionsToMutations(this.documents, actions as ContentLakeAction[]),
    )
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
      const submission: SubmissionRecord = {
        clientId,
        transactionId,
        mutations: [],
        submittedAt: this.tick(),
        outcome: 'pending',
      }
      this.submissions.push(submission)
      const pending: PendingCommit = {transactionId, mutations: [], submission, resolve, reject}
      try {
        pending.mutations = toMutations()
        submission.mutations = pending.mutations
      } catch (error) {
        const failure = toClientError(error)
        this.recordSettlement(submission, failure, false)
        reject(failure)
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
      this.recordSettlement(pending.submission, rejection, true)
      pending.reject(rejection)
      return
    }
    try {
      const {transactionId, results} = this.applyTransaction(
        pending.mutations,
        pending.transactionId,
        clientId,
      )
      this.recordSettlement(pending.submission, undefined, false)
      pending.resolve({transactionId, results})
    } catch (error) {
      const failure = toClientError(error)
      this.rejectedCommits.push({
        clientId,
        transactionId: pending.transactionId,
        statusCode: failure.statusCode,
      })
      this.recordSettlement(pending.submission, failure, false)
      pending.reject(failure)
    }
  }

  private tick(): number {
    const now = this.ticks
    this.ticks += 1
    return now
  }

  private recordSettlement(
    submission: SubmissionRecord,
    failure: ClientError | undefined,
    injected: boolean,
  ): void {
    submission.settledAt = this.tick()
    if (failure === undefined) {
      submission.outcome = 'accepted'
      return
    }
    submission.outcome = 'rejected'
    submission.statusCode = failure.statusCode
    submission.reason = failure.message
    submission.injected = injected
  }

  private applyTransaction(
    mutations: MutationPayload[],
    transactionId: string,
    identity: string,
  ): Omit<CommitResult, 'events'> {
    const {index, events, results} = commitTransaction({
      index: this.documents,
      mutations,
      transactionId,
      identity,
      timestamp: new Date().toISOString(),
    })
    this.documents = index
    const record = {transactionId, identity, mutations, events: events.map(toListenerEvent)}
    this.transactions.push(record)
    this.broadcast(record.events)
    return {transactionId, results}
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
