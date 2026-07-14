import {randomUUID} from 'node:crypto'

import {Mutation} from '@sanity/mutator'

import {BENCH_USER} from '../constants'
import {wholeValueEffects} from './mendoza'
import {
  type BenchDocument,
  type CommitResult,
  type MutationEventPayload,
  type MutationPayload,
} from './types'

/** The identity attached to committed transactions and emitted events. */
const IDENTITY = BENCH_USER.id

/** Fixed created/updated stamp for seeded fixtures — keeps seeding deterministic. */
const SEED_TIMESTAMP = '2020-01-01T00:00:00.000Z'

function targetIdOf(mutation: MutationPayload): string {
  const id =
    mutation.patch?.id ??
    mutation.delete?.id ??
    mutation.create?._id ??
    mutation.createIfNotExists?._id ??
    mutation.createOrReplace?._id
  if (!id) {
    throw new Error(`Cannot determine target document id for mutation: ${JSON.stringify(mutation)}`)
  }
  return id
}

export function newTransactionId(): string {
  return `bench-tx-${randomUUID()}`
}

/**
 * In-memory document store with Content Lake commit semantics: mutations are
 * applied with `@sanity/mutator`'s `Mutation.apply` (the same engine the
 * studio uses locally, so local and "server" state converge by construction),
 * `_rev` is set to the transaction id, and each commit produces rev-chained
 * mutation event payloads for the SSE hub to fan out.
 */
export class DocumentStore {
  private documents = new Map<string, BenchDocument>()

  get(id: string): BenchDocument | null {
    return this.documents.get(id) ?? null
  }

  getAll(): BenchDocument[] {
    return [...this.documents.values()]
  }

  /** Replace documents without emitting events (fixture seeding). */
  seed(documents: BenchDocument[]): void {
    for (const doc of documents) {
      this.documents.set(doc._id, {
        // Fixed timestamp, not new Date(): seeded fixtures must be byte-identical
        // across sessions and A/B sides — a wall-clock value would drift between
        // the reference and experiment runs and break hermeticity.
        _createdAt: SEED_TIMESTAMP,
        _updatedAt: SEED_TIMESTAMP,
        _rev: 'seed',
        ...doc,
      })
    }
  }

  reset(): void {
    this.documents.clear()
  }

  /**
   * Apply a transaction and return the mutation events to broadcast.
   * Mutations are grouped by target document; each affected document yields
   * one event with `previousRev` chaining from its pre-commit `_rev`
   * (omitted entirely for `appear` — see types.ts).
   */
  commit(mutations: MutationPayload[], transactionId = newTransactionId()): CommitResult {
    const timestamp = new Date().toISOString()

    const byDocument = new Map<string, MutationPayload[]>()
    for (const mutation of mutations) {
      const id = targetIdOf(mutation)
      const existing = byDocument.get(id)
      if (existing) {
        existing.push(mutation)
      } else {
        byDocument.set(id, [mutation])
      }
    }

    const events: MutationEventPayload[] = []
    const results: CommitResult['results'] = []
    const transactionTotalEvents = byDocument.size
    let transactionCurrentEvent = 1

    for (const [id, documentMutations] of byDocument) {
      const before = this.get(id)
      const after = new Mutation({
        transactionId,
        resultRev: transactionId,
        timestamp,
        mutations: documentMutations,
      }).apply(structuredClone(before))

      let transition: MutationEventPayload['transition']
      if (before === null && after !== null) {
        transition = 'appear'
      } else if (before !== null && after === null) {
        transition = 'disappear'
      } else if (after !== null) {
        transition = 'update'
      } else {
        // Deleting a nonexistent document — Content Lake acks the transaction
        // but emits no event for the unaffected document.
        continue
      }

      if (after === null) {
        this.documents.delete(id)
      } else {
        after._id = id
        after._rev = transactionId
        after._updatedAt = timestamp
        this.documents.set(id, after)
      }

      events.push({
        documentId: id,
        transactionId,
        identity: IDENTITY,
        mutations: documentMutations,
        effects: wholeValueEffects(before, after),
        ...(before?._rev ? {previousRev: before._rev} : {}),
        resultRev: transactionId,
        timestamp,
        transactionTotalEvents,
        transactionCurrentEvent,
        visibility: 'transaction',
        transition,
      })
      transactionCurrentEvent += 1

      results.push({
        id,
        operation:
          transition === 'appear' ? 'create' : transition === 'disappear' ? 'delete' : 'update',
      })
    }

    // `transactionTotalEvents` must equal the number of events actually
    // emitted — the studio buffers multi-transaction events until all have
    // arrived (getPairListener allPendingTransactionEventsReceived).
    for (const event of events) {
      event.transactionTotalEvents = events.length
    }

    return {transactionId, events, results}
  }
}
