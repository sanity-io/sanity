import {SanityEncoder} from '@sanity/mutate'
import {applyInIndex} from '@sanity/mutate/_unstable_apply'

import {ContentLakeError} from './contentLakeError'
import {type DocumentIndex, type MutationPayload} from './types'

// `@sanity/mutate` 0.18.2's decoder treats `dec` as `inc`, so a raw `inc` crashes and a raw `dec` is dropped.
function normalizeIncDec(mutation: MutationPayload): MutationPayload {
  if (mutation.patch === undefined) return mutation
  const {inc, dec, ...rest} = mutation.patch
  if (inc === undefined && dec === undefined) return mutation
  const negatedDec = Object.fromEntries(
    Object.entries((dec ?? {}) as Record<string, number>).map(([path, amount]) => [path, -amount]),
  )
  return {patch: {...rest, inc: {...(inc as Record<string, number>), ...negatedDec}, dec: {}}}
}

function stripTransactionFields(mutation: MutationPayload): MutationPayload {
  if (mutation.patch === undefined) return mutation
  const {ifRevisionID: _ifRevisionID, ...patch} = mutation.patch
  return {patch}
}

// Uses `@sanity/mutate` so the result never comes from the `@sanity/mutator` engine the studio runs.
export function applyMutations(index: DocumentIndex, mutations: MutationPayload[]): DocumentIndex {
  try {
    const decoded = SanityEncoder.decodeAll(
      mutations.map(stripTransactionFields).map(normalizeIncDec) as never[],
    )
    return applyInIndex(index as never, decoded as never) as DocumentIndex
  } catch (error) {
    throw new ContentLakeError(400, error instanceof Error ? error.message : String(error))
  }
}
