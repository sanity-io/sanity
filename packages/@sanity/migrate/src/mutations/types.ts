import type {Path} from '@sanity/types'
import type {Operation} from './operations/types'
import {Optional} from './typeUtils'

export type NodePatchList =
  | [NodePatch, ...NodePatch[]]
  | NodePatch[]
  | readonly NodePatch[]
  | readonly [NodePatch, ...NodePatch[]]

export type SanityDocument = {
  _id?: string
  _type: string
  _createdAt?: string
  _updatedAt?: string
  _rev?: string
}

export type CreateMutation<Doc extends Optional<SanityDocument, '_id'>> = {
  type: 'create'
  document: Doc
}

export type CreateIfNotExistsMutation<Doc extends SanityDocument> = {
  type: 'createIfNotExists'
  document: Doc
}

export type CreateOrReplaceMutation<Doc extends SanityDocument> = {
  type: 'createOrReplace'
  document: Doc
}

export type DeleteMutation = {
  type: 'delete'
  id: string
}

export type PatchMutation<Patches extends NodePatchList = NodePatchList> = {
  type: 'patch'
  id: string
  patches: Patches
  options?: PatchOptions
}

export type Mutation<Doc extends SanityDocument = any> =
  | CreateMutation<Doc>
  | CreateIfNotExistsMutation<Doc>
  | CreateOrReplaceMutation<Doc>
  | DeleteMutation
  | PatchMutation

export type NodePatch<P extends Path = Path, O extends Operation = Operation> = {
  path: P
  op: O
}

export type PatchOptions = {
  ifRevision?: string
}
