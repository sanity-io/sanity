import type {Path} from '@sanity/types'
import arrify from 'arrify'

import {fromString} from '@sanity/util/paths'
import {type Operation} from './operations/types'
import {
  type CreateIfNotExistsMutation,
  type CreateMutation,
  type CreateOrReplaceMutation,
  type DeleteMutation,
  type NodePatch,
  type NodePatchList,
  type PatchMutation,
  type PatchOptions,
  type SanityDocument,
} from './types'
import {NormalizeReadOnlyArray, Optional, Tuplify} from './typeUtils'

/**
 * Creates a new document.
 * @param document - The document to be created.
 * @returns The mutation operation to create the document.
 * @beta
 */
export function create<Doc extends Optional<SanityDocument, '_id'>>(
  document: Doc,
): CreateMutation<Doc> {
  return {type: 'create', document}
}

/**
 * Applies a patch to a document.
 * @param id - The id of the document to be patched.
 * @param patches - The patches to be applied.
 * @param options - Optional patch options.
 * @returns The mutation operation to patch the document.
 * @beta
 */
export function patch<P extends NodePatchList | NodePatch>(
  id: string,
  patches: P,
  options?: PatchOptions,
): PatchMutation<NormalizeReadOnlyArray<Tuplify<P>>> {
  return {
    type: 'patch',
    id,
    patches: arrify(patches) as any,
    ...(options ? {options} : {}),
  }
}

/**
 * Creates a node patch at a specific path.
 * @param path - The path where the operation should be applied.
 * @param operation - The operation to be applied.
 * @returns The node patch.
 * @beta
 */
export function at<O extends Operation>(path: Path | string, operation: O): NodePatch<Path, O> {
  return {
    path: typeof path === 'string' ? fromString(path) : path,
    op: operation,
  }
}

/**
 * Creates a document if it does not exist.
 * @param document - The document to be created.
 * @returns The mutation operation to create the document if it does not exist.
 * @beta
 */
export function createIfNotExists<Doc extends SanityDocument>(
  document: Doc,
): CreateIfNotExistsMutation<Doc> {
  return {type: 'createIfNotExists', document}
}

/**
 * Creates or replaces a document.
 * @param document - The document to be created or replaced.
 * @returns The mutation operation to create or replace the document.
 * @beta
 */
export function createOrReplace<Doc extends SanityDocument>(
  document: Doc,
): CreateOrReplaceMutation<Doc> {
  return {type: 'createOrReplace', document}
}

/**
 * Deletes a document.
 * @param id - The id of the document to be deleted.
 * @returns The mutation operation to delete the document.
 * @beta
 */
export function delete_(id: string): DeleteMutation {
  return {type: 'delete', id}
}

/**
 * Alias for delete_
 */
export const del = delete_
