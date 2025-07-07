import {
  processSetSynchronization,
  type SetSynchronization,
  type SynchronizationRequest,
  type SynchronizationResult,
} from '@sanity/descriptors'

import {type RegistryType} from './types'

// This file provides wrapper types/functions for synchronizing a schema.
// This avoids users of `@sanity/schema` to have to depend on `@sanity/descriptors`.

export type SchemaSynchronizationRequest = SynchronizationRequest
export type SchemaSynchronizationResult = SynchronizationResult

/**
 * Returns the next request that should be generated for synchronizing the
 * schema, based on the previous response from the /synchronize endpoint.
 *
 * @param response - The previous response, or `null` if it's the first request.
 * @returns The next request, or `null` if it's been fully synchronized.
 */
export function processSchemaSynchronization(
  sync: SetSynchronization<RegistryType>,
  response: SchemaSynchronizationResult | null,
): SchemaSynchronizationRequest | null {
  return processSetSynchronization(sync, response)
}
