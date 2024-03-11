import {type RelativePosition} from '../../mutations/operations/types'
import {type AnyArray} from '../../utils/typeUtils'

export type Id = string
export type RevisionLock = string
export type CompactPath = string
export type ItemRef = string | number

export type DeleteMutation = ['delete', Id]
export type CreateMutation<Doc> = ['create', Doc]
export type CreateIfNotExistsMutation<Doc> = ['createIfNotExists', Doc]
export type CreateOrReplaceMutation<Doc> = ['createOrReplace', Doc]

export type UnsetMutation = [
  'patch',
  'unset',
  Id,
  CompactPath,
  [],
  RevisionLock?,
]
export type InsertMutation = [
  'patch',
  'insert',
  Id,
  CompactPath,
  [RelativePosition, ItemRef, AnyArray],
  RevisionLock?,
]

export type UpsertMutation = [
  'patch',
  'upsert',
  Id,
  CompactPath,
  [RelativePosition, ItemRef, AnyArray],
  RevisionLock?,
]

export type TruncateMutation = [
  'patch',
  'truncate',
  Id,
  CompactPath,
  [startIndex: number, endIndex: number | undefined],
  RevisionLock?,
]

export type IncMutation = [
  'patch',
  'inc',
  Id,
  CompactPath,
  [number],
  RevisionLock?,
]
export type DecMutation = [
  'patch',
  'dec',
  Id,
  CompactPath,
  [number],
  RevisionLock?,
]
export type AssignMutation = [
  'patch',
  'assign',
  Id,
  CompactPath,
  [object],
  RevisionLock?,
]
export type UnassignMutation = [
  'patch',
  'assign',
  Id,
  CompactPath,
  [string[]],
  RevisionLock?,
]
export type ReplaceMutation = [
  'patch',
  'replace',
  Id,
  CompactPath,
  [ItemRef, AnyArray],
  RevisionLock?,
]
export type SetMutation = ['patch', 'set', Id, CompactPath, any, RevisionLock?]
export type SetIfMissingMutation = [
  'patch',
  'setIfMissing',
  Id,
  CompactPath,
  [unknown],
  RevisionLock?,
]

export type DiffMatchPatchMutation = [
  'patch',
  'diffMatchPatch',
  Id,
  CompactPath,
  [string],
  RevisionLock?,
]

export type CompactPatchMutation =
  | UnsetMutation
  | InsertMutation
  | UpsertMutation
  | TruncateMutation
  | IncMutation
  | DecMutation
  | SetMutation
  | SetIfMissingMutation
  | DiffMatchPatchMutation
  | AssignMutation
  | UnassignMutation
  | ReplaceMutation

export type CompactMutation<Doc> =
  | DeleteMutation
  | CreateMutation<Doc>
  | CreateIfNotExistsMutation<Doc>
  | CreateOrReplaceMutation<Doc>
  | CompactPatchMutation
