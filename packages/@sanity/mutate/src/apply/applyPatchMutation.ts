import {type PatchMutation, type SanityDocumentBase} from '../mutations/types'
import {type NormalizeReadOnlyArray} from '../utils/typeUtils'
import {applyPatches} from './patch/applyNodePatch'
import {type ApplyPatches} from './patch/typings/applyNodePatch'

export type ApplyPatchMutation<
  Mutation extends PatchMutation,
  Doc extends SanityDocumentBase,
> =
  Mutation extends PatchMutation<infer Patches>
    ? ApplyPatches<NormalizeReadOnlyArray<Patches>, Doc>
    : Doc

export function applyPatchMutation<
  const Mutation extends PatchMutation,
  const Doc extends SanityDocumentBase,
>(mutation: Mutation, document: Doc): ApplyPatchMutation<Mutation, Doc> {
  if (
    mutation.options?.ifRevision &&
    document._rev !== mutation.options.ifRevision
  ) {
    throw new Error('Revision mismatch')
  }
  if (mutation.id !== document._id) {
    throw new Error(
      `Document id mismatch. Refusing to apply mutation for document with id="${mutation.id}" on the given document with id="${document._id}"`,
    )
  }
  return applyPatches(mutation.patches, document) as any
}
