import {nanoid} from 'nanoid'

import {
  type CreateIfNotExistsMutation,
  type CreateMutation,
  type CreateOrReplaceMutation,
  type DeleteMutation,
  type Mutation,
  type PatchMutation,
  type SanityDocumentBase,
} from '../mutations/types'
import {applyPatchMutation} from './applyPatchMutation'
import {assignId, hasId, type RequiredSelect} from './store'

export type DocumentIndex<Doc extends SanityDocumentBase> = {[id: string]: Doc}

export function applyInIndex<
  Doc extends SanityDocumentBase,
  Index extends DocumentIndex<ToStored<Doc>>,
>(index: Index, mutations: Mutation<Doc>[]): Index {
  return mutations.reduce((prev, mutation) => {
    if (mutation.type === 'create') {
      return createIn(prev, mutation)
    }
    if (mutation.type === 'createIfNotExists') {
      return createIfNotExistsIn(prev, mutation)
    }
    if (mutation.type === 'delete') {
      return deleteIn(prev, mutation)
    }
    if (mutation.type === 'createOrReplace') {
      return createOrReplaceIn(prev, mutation)
    }
    if (mutation.type === 'patch') {
      return patchIn(prev, mutation)
    }
    // @ts-expect-error all cases should be covered
    throw new Error(`Invalid mutation type: ${mutation.type}`)
  }, index)
}

export type ToStored<Doc extends SanityDocumentBase> = Doc &
  Required<SanityDocumentBase>

export type ToIdentified<Doc extends SanityDocumentBase> = RequiredSelect<
  Doc,
  '_id'
>

export type StoredDocument = ToStored<SanityDocumentBase>

function createIn<
  Index extends DocumentIndex<Doc>,
  Doc extends SanityDocumentBase,
>(index: Index, mutation: CreateMutation<Doc>): Index {
  const document = assignId(mutation.document, nanoid)

  if (document._id in index) {
    throw new Error('Document already exist')
  }
  return {...index, [document._id]: mutation.document}
}

function createIfNotExistsIn<
  Index extends DocumentIndex<Doc>,
  Doc extends SanityDocumentBase,
>(index: Index, mutation: CreateIfNotExistsMutation<Doc>): Index {
  if (!hasId(mutation.document)) {
    throw new Error('Cannot createIfNotExists on document without _id')
  }
  return mutation.document._id in index
    ? index
    : {...index, [mutation.document._id]: mutation.document}
}

function createOrReplaceIn<
  Index extends DocumentIndex<Doc>,
  Doc extends SanityDocumentBase,
>(index: Index, mutation: CreateOrReplaceMutation<Doc>): Index {
  if (!hasId(mutation.document)) {
    throw new Error('Cannot createIfNotExists on document without _id')
  }

  return {...index, [mutation.document._id]: mutation.document}
}

function deleteIn<Index extends DocumentIndex<SanityDocumentBase>>(
  index: Index,
  mutation: DeleteMutation,
): Index {
  if (mutation.id in index) {
    const copy = {...index}
    delete copy[mutation.id]
    return copy
  } else {
    return index
  }
}

function patchIn<Index extends DocumentIndex<SanityDocumentBase>>(
  index: Index,
  mutation: PatchMutation,
): Index {
  if (!(mutation.id in index)) {
    throw new Error('Cannot apply patch on nonexistent document')
  }
  const current = index[mutation.id]!
  const next = applyPatchMutation(mutation, current)

  return next === current ? index : {...index, [mutation.id]: next}
}
