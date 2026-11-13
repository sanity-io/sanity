import {type SanityDocument, type Schema} from '@sanity/types'
import {combineLatest, type Subscription} from 'rxjs'

import {type MutationPayload} from '../../src/core/store/document/buffered-doc/types'
import {checkoutPair} from '../../src/core/store/document/document-pair/checkoutPair'
import {consistencyStatus} from '../../src/core/store/document/document-pair/consistencyStatus'
import {editOperations} from '../../src/core/store/document/document-pair/editOperations'
import {editState, type EditStateFor} from '../../src/core/store/document/document-pair/editState'
import {type OperationsAPI} from '../../src/core/store/document/document-pair/operations/types'
import {type IdPair} from '../../src/core/store/document/types'
import {type HistoryStore} from '../../src/core/store/history/createHistoryStore'
import {type FakeContentLake} from './fakeContentLake'
import {createFakeSanityClient} from './fakeSanityClient'

export type RawPatch = Record<string, unknown>

export interface EngineClient {
  readonly id: string
  patch(documentId: string, patches: RawPatch[]): void
  mutate(documentId: string, mutations: MutationPayload[]): void
  commit(): void
  localDocument(documentId: string): SanityDocument | null
  consistent(): boolean
  errors(): unknown[]
  transactionLocked(): boolean
  teardown(): void
}

export interface StudioEngineOptions {
  lake: FakeContentLake
  clientId: string
  idPair: IdPair
  dataset: string
}

export function createStudioPairClient(options: StudioEngineOptions): EngineClient {
  const {lake, clientId, idPair, dataset} = options
  const client = createFakeSanityClient({lake, clientId, dataset})
  const pair = checkoutPair(client, idPair, undefined, {})
  const members = {[idPair.draftId]: pair.draft, [idPair.publishedId]: pair.published}
  const snapshots = new Map<string, SanityDocument | null>()
  const errors: unknown[] = []
  let consistent = true
  let locked = false

  const subscriptions: Subscription[] = Object.entries(members).map(([documentId, member]) =>
    member.events.subscribe({
      next: (event) => {
        if (event.type === 'snapshot' || event.type === 'mutation' || event.type === 'rebase') {
          snapshots.set(documentId, (event.document as SanityDocument | null) ?? null)
        }
      },
      error: (error) => errors.push(error),
    }),
  )
  subscriptions.push(
    combineLatest([pair.draft.consistency$, pair.published.consistency$]).subscribe({
      next: ([draft, published]) => {
        consistent = draft && published
      },
      error: (error) => errors.push(error),
    }),
    pair.transactionsPendingEvents$.subscribe({
      next: (event) => {
        locked = event.phase === 'begin'
      },
      error: (error) => errors.push(error),
    }),
  )

  function memberFor(documentId: string) {
    const member = members[documentId]
    if (member === undefined) throw new Error(`${clientId} has not checked out ${documentId}`)
    return member
  }

  return {
    id: clientId,
    patch: (documentId, patches) => {
      const member = memberFor(documentId)
      member.mutate(member.patch(patches))
    },
    mutate: (documentId, mutations) => memberFor(documentId).mutate(mutations),
    commit: () => {
      pair.draft.commit()
      pair.published.commit()
    },
    localDocument: (documentId) => snapshots.get(documentId) ?? null,
    consistent: () => consistent,
    errors: () => errors,
    transactionLocked: () => locked,
    teardown: () => subscriptions.forEach((subscription) => subscription.unsubscribe()),
  }
}

export interface StudioOperationsEngineOptions extends StudioEngineOptions {
  schema: Schema
  typeName: string
}

export function createStudioOperationsClient(options: StudioOperationsEngineOptions): EngineClient {
  const {lake, clientId, idPair, dataset, schema, typeName} = options
  const client = createFakeSanityClient({lake, clientId, dataset})
  const context = {client, historyStore: {} as HistoryStore, schema}
  const errors: unknown[] = []
  let operations: OperationsAPI | undefined
  let state: EditStateFor | undefined
  let consistent = true

  const subscriptions: Subscription[] = [
    editOperations(context, idPair, typeName).subscribe({
      next: (value) => {
        operations = value
      },
      error: (error) => errors.push(error),
    }),
    editState(context, idPair, typeName).subscribe({
      next: (value) => {
        state = value
      },
      error: (error) => errors.push(error),
    }),
    consistencyStatus(client, idPair, typeName).subscribe({
      next: (value) => {
        consistent = value
      },
      error: (error) => errors.push(error),
    }),
  ]

  function ready(): OperationsAPI {
    if (operations === undefined || operations.patch.disabled === 'NOT_READY') {
      throw new Error(`${clientId} operations are not ready`)
    }
    return operations
  }

  function localDocument(documentId: string): SanityDocument | null {
    if (state === undefined) return null
    if (documentId === idPair.draftId) return state.draft
    if (documentId === idPair.publishedId) return state.published
    return null
  }

  return {
    id: clientId,
    patch: (_documentId, patches) => ready().patch.execute(patches),
    mutate: () => {
      throw new Error('The operations seam only exposes patches')
    },
    commit: () => ready().commit.execute(),
    localDocument,
    consistent: () => consistent,
    errors: () => errors,
    transactionLocked: () => state?.transactionSyncLock?.enabled ?? false,
    teardown: () => subscriptions.forEach((subscription) => subscription.unsubscribe()),
  }
}
