import {
  type Mutation,
  type PatchMutation,
  type SanityDocumentBase,
} from '../../mutations/types'
import {type Index, type KeyedPathElement} from '../../path'
import {parse as parsePath} from '../../path/parser/parse'
import {
  type CompactMutation,
  type CompactPatchMutation,
  type CreateIfNotExistsMutation,
  type CreateMutation,
  type CreateOrReplaceMutation,
  type DeleteMutation,
  type ItemRef,
} from './types'

export {Mutation, SanityDocumentBase}

export function decode<Doc extends SanityDocumentBase>(
  mutations: CompactMutation<Doc>[],
): Mutation[] {
  return mutations.map(decodeMutation)
}

export function decodeMutation<Doc extends SanityDocumentBase>(
  mutation: CompactMutation<Doc>,
): Mutation {
  const [type] = mutation
  if (type === 'delete') {
    const [, id] = mutation as DeleteMutation
    return {id, type}
  } else if (type === 'create') {
    const [, document] = mutation as CreateMutation<Doc>
    return {type, document}
  } else if (type === 'createIfNotExists') {
    const [, document] = mutation as CreateIfNotExistsMutation<Doc>
    return {type, document}
  } else if (type === 'createOrReplace') {
    const [, document] = mutation as CreateOrReplaceMutation<Doc>
    return {type, document}
  } else if (type === 'patch') {
    return decodePatchMutation(mutation)
  }
  throw new Error(`Unrecognized mutation: ${JSON.stringify(mutation)}`)
}

function decodePatchMutation(mutation: CompactPatchMutation): PatchMutation {
  const [, type, id, serializedPath, , revisionId] = mutation

  const path = parsePath(serializedPath)
  if (type === 'dec' || type === 'inc') {
    const [, , , , [amount]] = mutation
    return {
      type: 'patch',
      id,
      patches: [{path, op: {type: 'inc', amount}}],
      ...createOpts(revisionId),
    }
  }
  if (type === 'unset') {
    return {
      type: 'patch',
      id,
      patches: [{path, op: {type: 'unset'}}],
      ...createOpts(revisionId),
    }
  }
  if (type === 'insert') {
    const [, , , , [position, ref, items]] = mutation
    return {
      type: 'patch',
      id,
      patches: [
        {
          path,
          op: {
            type: 'insert',
            position,
            items,
            referenceItem: typeof ref === 'string' ? {_key: ref} : ref,
          },
        },
      ],
      ...createOpts(revisionId),
    }
  }
  if (type === 'set') {
    const [, , , , [value]] = mutation
    return {
      type: 'patch',
      id,
      patches: [{path, op: {type: 'set', value}}],
      ...createOpts(revisionId),
    }
  }
  if (type === 'setIfMissing') {
    const [, , , , [value]] = mutation
    return {
      type: 'patch',
      id,
      patches: [{path, op: {type: 'setIfMissing', value}}],
      ...createOpts(revisionId),
    }
  }
  if (type === 'diffMatchPatch') {
    const [, , , , [value]] = mutation
    return {
      type: 'patch',
      id,
      patches: [{path, op: {type: 'diffMatchPatch', value}}],
      ...createOpts(revisionId),
    }
  }
  if (type === 'truncate') {
    const [, , , , [startIndex, endIndex]] = mutation

    return {
      type: 'patch',
      id,
      patches: [{path, op: {type: 'truncate', startIndex, endIndex}}],
      ...createOpts(revisionId),
    }
  }
  if (type === 'assign') {
    const [, , , , [value]] = mutation
    return {
      type: 'patch',
      id,
      patches: [{path, op: {type: 'assign', value}}],
      ...createOpts(revisionId),
    }
  }
  if (type === 'replace') {
    const [, , , , [ref, items]] = mutation
    return {
      type: 'patch',
      id,
      patches: [
        {path, op: {type: 'replace', items, referenceItem: decodeItemRef(ref)}},
      ],
      ...createOpts(revisionId),
    }
  }
  if (type === 'upsert') {
    const [, , , , [position, referenceItem, items]] = mutation
    return {
      type: 'patch',
      id,
      patches: [
        {
          path,
          op: {
            type: 'upsert',
            items,
            referenceItem: decodeItemRef(referenceItem),
            position,
          },
        },
      ],
      ...createOpts(revisionId),
    }
  }
  throw new Error(`Invalid mutation type: ${type}`)
}

function decodeItemRef(ref: ItemRef): Index | KeyedPathElement {
  return typeof ref === 'string' ? {_key: ref} : ref
}

function createOpts(revisionId: undefined | string) {
  return revisionId ? {options: {ifRevision: revisionId}} : null
}
