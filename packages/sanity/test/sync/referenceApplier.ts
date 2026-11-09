import {SanityEncoder} from '@sanity/mutate'
import {applyInIndex} from '@sanity/mutate/_unstable_apply'
import {type SanityDocument} from '@sanity/types'

import {type MutationPayload} from '../../src/core/store/document/buffered-doc/types'

export type DocumentIndex = Record<string, SanityDocument>

export class ReferenceApplierError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ReferenceApplierError'
  }
}

// `@sanity/mutate` 0.18.2's decoder treats `dec` as `inc`, so a raw `inc` crashes and a raw `dec` is dropped.
function normalizeIncDec(mutation: MutationPayload): MutationPayload {
  if (mutation.patch === undefined) return mutation
  const {inc, dec, ...rest} = mutation.patch
  if (inc === undefined && dec === undefined) return mutation
  const negatedDec = Object.fromEntries(
    Object.entries((dec ?? {}) as Record<string, number>).map(([path, amount]) => [path, -amount]),
  )
  return {patch: {...rest, inc: {...inc, ...negatedDec}, dec: {}}}
}

function stripTransactionFields(mutation: MutationPayload): MutationPayload {
  if (mutation.patch === undefined) return mutation
  const {ifRevisionID: _ifRevisionID, ...patch} = mutation.patch
  return {patch}
}

// Uses `@sanity/mutate` so the server's result never comes from the `@sanity/mutator` engine under test.
export function applyMutations(index: DocumentIndex, mutations: MutationPayload[]): DocumentIndex {
  try {
    const decoded = SanityEncoder.decodeAll(
      mutations.map(stripTransactionFields).map(normalizeIncDec) as never[],
    )
    return applyInIndex(index as never, decoded as never) as DocumentIndex
  } catch (error) {
    throw new ReferenceApplierError(error instanceof Error ? error.message : String(error))
  }
}
