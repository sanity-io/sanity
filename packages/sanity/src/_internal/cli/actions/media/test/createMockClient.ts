import {type PatchOperations} from '@sanity/client'
import {uuid} from '@sanity/uuid'
import {of} from 'rxjs'
import {type SanityClient} from 'sanity'

/**
 * A very naive mock Sanity Client implementation that caters to this exact use case.
 */
export function createMockClient(): {
  client: SanityClient
  transactions: Record<string, {documentId: string; operation: PatchOperations}[]>
} {
  const transactions: Record<string, {documentId: string; operation: PatchOperations}[]> = {}

  const mockClient = {
    observable: {
      transaction() {
        const transactionId = uuid()
        const operations: {documentId: string; operation: PatchOperations}[] = []
        transactions[transactionId] = operations

        return {
          patch(documentId: string, operation: PatchOperations) {
            operations.push({documentId, operation})
            return this
          },
          commit: () => of([]),
        }
      },
    },
  } as unknown as SanityClient

  return {
    client: mockClient,
    transactions,
  }
}
