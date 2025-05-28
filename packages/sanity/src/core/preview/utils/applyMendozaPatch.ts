import {type SanityDocument} from '@sanity/types'
import {applyPatch, type RawPatch} from 'mendoza'

function omitRev(document: SanityDocument | undefined) {
  if (document === undefined) {
    return undefined
  }
  const {_rev, ...doc} = document
  return doc
}

/**
 *
 * @param document - The document to apply the patch to
 * @param patch - The mendoza patch to apply
 * @param baseRev - The revision of the document that the patch is calculated from. This is used to ensure that the patch is applied to the correct revision of the document
 */
export function applyMendozaPatch<T extends SanityDocument | undefined>(
  document: T,
  patch: RawPatch,
  baseRev: string,
): T | undefined {
  if (baseRev !== document?._rev) {
    throw new Error(
      'Invalid document revision. The provided patch is calculated from a different revision than the current document',
    )
  }
  const next = applyPatch(omitRev(document), patch)
  return next === null ? undefined : next
}

export function applyMutationEventEffects(
  document: SanityDocument | undefined,
  event: {effects: {apply: RawPatch}; previousRev: string; resultRev: string},
) {
  if (!event.effects) {
    throw new Error(
      'Mutation event is missing effects. Is the listener set up with effectFormat=mendoza?',
    )
  }
  const next = applyMendozaPatch(document, event.effects.apply, event.previousRev)
  // next will be undefined in case of deletion
  return next ? {...next, _rev: event.resultRev} : undefined
}
