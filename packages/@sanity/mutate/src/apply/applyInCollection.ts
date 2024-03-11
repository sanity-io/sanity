import {
  type CreateIfNotExistsMutation,
  type CreateMutation,
  type CreateOrReplaceMutation,
  type DeleteMutation,
  type Mutation,
  type PatchMutation,
  type SanityDocumentBase,
} from '../mutations/types'
import {arrify} from '../utils/arrify'
import {applyPatchMutation} from './applyPatchMutation'
import {splice} from './utils/array'

export function applyInCollection<Doc extends SanityDocumentBase>(
  collection: Doc[],
  mutations: Mutation | Mutation[],
) {
  const a = arrify(mutations) as Mutation[]
  return a.reduce((prev, mutation) => {
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
  }, collection)
}

function createIn<Doc extends SanityDocumentBase>(
  collection: Doc[],
  mutation: CreateMutation<Doc>,
) {
  const currentIdx = collection.findIndex(
    doc => doc._id === mutation.document._id,
  )
  if (currentIdx !== -1) {
    throw new Error('Document already exist')
  }
  return collection.concat(mutation.document)
}

function createIfNotExistsIn<Doc extends SanityDocumentBase>(
  collection: Doc[],
  mutation: CreateIfNotExistsMutation<Doc>,
) {
  const currentIdx = collection.findIndex(
    doc => doc._id === mutation.document._id,
  )
  return currentIdx === -1 ? collection.concat(mutation.document) : collection
}

function createOrReplaceIn<Doc extends SanityDocumentBase>(
  collection: Doc[],
  mutation: CreateOrReplaceMutation<Doc>,
) {
  const currentIdx = collection.findIndex(
    doc => doc._id === mutation.document._id,
  )
  return currentIdx === -1
    ? collection.concat(mutation.document)
    : splice(collection, currentIdx, 1, [mutation.document])
}

function deleteIn<Doc extends SanityDocumentBase>(
  collection: Doc[],
  mutation: DeleteMutation,
) {
  const currentIdx = collection.findIndex(doc => doc._id === mutation.id)
  return currentIdx === -1 ? collection : splice(collection, currentIdx, 1)
}

function patchIn<Doc extends SanityDocumentBase>(
  collection: Doc[],
  mutation: PatchMutation,
): Doc[] {
  const currentIdx = collection.findIndex(doc => doc._id === mutation.id)
  if (currentIdx === -1) {
    throw new Error('Cannot apply patch on nonexistent document')
  }
  const current = collection[currentIdx]!

  const next = applyPatchMutation(mutation, current)

  return next === current
    ? collection
    : splice(collection, currentIdx, 1, [next])
}
