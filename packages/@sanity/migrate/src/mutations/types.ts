import {type Path} from '@sanity/types'

import {type Operation} from './operations/types'
import {type Optional} from './typeUtils'

/**
 * A list of {@link NodePatch} objects.
 */
export type NodePatchList =
  | [NodePatch, ...NodePatch[]]
  | NodePatch[]
  | readonly NodePatch[]
  | readonly [NodePatch, ...NodePatch[]]

/**
 * A sanity document
 */
export type SanityDocument = {
  _id?: string
  _type: string
  _createdAt?: string
  _updatedAt?: string
  _rev?: string
}

/**
 * Represents a create-mutation that can be applied to a Sanity document.
 */
export type CreateMutation<Doc extends Optional<SanityDocument, '_id'>> = {
  type: 'create'
  document: Doc
}

/**
 * Represents a createIfNotExists-mutation that can be applied to a Sanity document if it does not exist.
 */
export type CreateIfNotExistsMutation<Doc extends SanityDocument> = {
  type: 'createIfNotExists'
  document: Doc
}

/**
 * Represents a mutation that can create or replace a document in the Sanity Content Lake given its ID.
 */
export type CreateOrReplaceMutation<Doc extends SanityDocument> = {
  type: 'createOrReplace'
  document: Doc
}

/**
 * Represents a mutation that can delete a document in the Sanity Content Lake.
 */
export type DeleteMutation = {
  type: 'delete'
  id: string
}

/**
 * Represents a patch mutation that can change a value for a document in the Sanity Content Lake.
 */
export type PatchMutation<Patches extends NodePatchList = NodePatchList> = {
  type: 'patch'
  id: string
  patches: Patches
  options?: PatchOptions
}

/**
 * Represents a mutation that can be applied to a document in the Sanity Content Lake.
 */
export type Mutation<Doc extends SanityDocument = any> =
  | CreateMutation<Doc>
  | CreateIfNotExistsMutation<Doc>
  | CreateOrReplaceMutation<Doc>
  | DeleteMutation
  | PatchMutation

/**
 * A NodePatch represents a single operation that can be applied at a node at a specific path in a Sanity document.
 */
export type NodePatch<P extends Path = Path, O extends Operation = Operation> = {
  path: P
  op: O
}

/**
 * Options for a patch operation.
 */
export type PatchOptions = {
  ifRevision?: string
}
