// An example of a compact transport/serialization format
import {
  type Mutation,
  type NodePatch,
  type SanityDocumentBase,
} from '../../mutations/types'
import {type Index, type KeyedPathElement} from '../../path'
import {stringify as stringifyPath} from '../../path/parser/stringify'
import {
  type CompactMutation,
  type CompactPatchMutation,
  type ItemRef,
} from './types'

export function encode<Doc extends SanityDocumentBase>(
  mutations: Mutation[],
): CompactMutation<Doc>[] {
  return mutations.flatMap(m => encodeMutation<Doc>(m))
}

function encodeItemRef(ref: Index | KeyedPathElement): ItemRef {
  return typeof ref === 'number' ? ref : ref._key
}

function encodeMutation<Doc extends SanityDocumentBase>(
  mutation: Mutation,
): CompactMutation<Doc>[] {
  if (
    mutation.type === 'create' ||
    mutation.type === 'createIfNotExists' ||
    mutation.type === 'createOrReplace'
  ) {
    return [[mutation.type, mutation.document]]
  }
  if (mutation.type === 'delete') {
    return [['delete', mutation.id]]
  }
  if (mutation.type === 'patch') {
    return mutation.patches.map(patch =>
      maybeAddRevision(
        mutation.options?.ifRevision,
        encodePatchMutation(mutation.id, patch),
      ),
    )
  }

  //@ts-expect-error - all cases are covered
  throw new Error(`Invalid mutation type: ${mutation.type}`)
}

function encodePatchMutation(
  id: string,
  patch: NodePatch<any>,
): CompactPatchMutation {
  const {op} = patch
  const path = stringifyPath(patch.path)
  if (op.type === 'unset') {
    return ['patch', 'unset', id, path, []]
  }
  if (op.type === 'diffMatchPatch') {
    return ['patch', 'diffMatchPatch', id, path, [op.value]]
  }
  if (op.type === 'inc' || op.type === 'dec') {
    return ['patch', op.type, id, path, [op.amount]]
  }
  if (op.type === 'set') {
    return ['patch', op.type, id, path, [op.value]]
  }
  if (op.type === 'setIfMissing') {
    return ['patch', op.type, id, path, [op.value]]
  }
  if (op.type === 'insert') {
    return [
      'patch',
      'insert',
      id,
      path,
      [op.position, encodeItemRef(op.referenceItem), op.items],
    ]
  }
  if (op.type === 'upsert') {
    return [
      'patch',
      'upsert',
      id,
      path,
      [op.position, encodeItemRef(op.referenceItem), op.items],
    ]
  }
  if (op.type === 'assign') {
    return ['patch', 'assign', id, path, [op.value]]
  }
  if (op.type === 'unassign') {
    return ['patch', 'assign', id, path, [op.keys]]
  }
  if (op.type === 'replace') {
    return [
      'patch',
      'replace',
      id,
      path,
      [encodeItemRef(op.referenceItem), op.items],
    ]
  }
  if (op.type === 'truncate') {
    return ['patch', 'truncate', id, path, [op.startIndex, op.endIndex]]
  }
  // @ts-expect-error all cases are covered
  throw new Error(`Invalid operation type: ${op.type}`)
}

function maybeAddRevision<T extends CompactPatchMutation>(
  revision: string | undefined,
  mut: T,
): T {
  const [mutType, patchType, id, path, args] = mut
  return (revision ? [mutType, patchType, id, path, args, revision] : mut) as T
}
