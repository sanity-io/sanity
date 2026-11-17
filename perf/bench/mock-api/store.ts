import {randomUUID} from 'node:crypto'

import {commitTransaction, type DocumentIndex} from '@repo/content-lake-model'

import {BENCH_USER} from '../constants'
import {type BenchDocument, type CommitResult, type MutationPayload} from './types'

// Fixed rather than wall-clock: seeded fixtures must be byte-identical across sessions and A/B sides.
const SEED_TIMESTAMP = '2020-01-01T00:00:00.000Z'

export function newTransactionId(): string {
  return `bench-tx-${randomUUID()}`
}

export class DocumentStore {
  private documents: DocumentIndex = {}

  get index(): DocumentIndex {
    return this.documents
  }

  get(id: string): BenchDocument | null {
    return this.documents[id] ?? null
  }

  getAll(): BenchDocument[] {
    return Object.values(this.documents)
  }

  /** Replace documents without emitting events (fixture seeding). */
  seed(documents: BenchDocument[]): void {
    this.documents = {
      ...this.documents,
      ...Object.fromEntries(
        documents.map((doc) => [
          doc._id,
          {_createdAt: SEED_TIMESTAMP, _updatedAt: SEED_TIMESTAMP, _rev: 'seed', ...doc},
        ]),
      ),
    }
  }

  reset(): void {
    this.documents = {}
  }

  commit(mutations: MutationPayload[], transactionId = newTransactionId()): CommitResult {
    const {index, ...result} = commitTransaction({
      index: this.documents,
      mutations,
      transactionId,
      identity: BENCH_USER.id,
      timestamp: new Date().toISOString(),
    })
    this.documents = index
    return result
  }
}
