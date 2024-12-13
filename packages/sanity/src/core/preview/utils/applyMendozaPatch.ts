import {type SanityDocument} from '@sanity/types'
import {applyPatch, type RawPatch} from 'mendoza'

function omitRev(document: SanityDocument | undefined) {
  if (document === undefined) {
    return undefined
  }
  const {_rev, ...doc} = document
  return doc
}

export function applyMendozaPatch<T extends SanityDocument | undefined>(
  document: T,
  patch: RawPatch,
): T {
  const next = applyPatch(omitRev(document), patch)
  return next === null ? undefined : next
}
