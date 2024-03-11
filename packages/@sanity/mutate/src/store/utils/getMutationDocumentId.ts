type MutationLike =
  | {type: 'patch'; id: string}
  | {type: 'create'; document: {_id: string}}
  | {type: 'delete'; id: string}
  | {type: 'createIfNotExists'; document: {_id: string}}
  | {type: 'createOrReplace'; document: {_id: string}}

export function getMutationDocumentId(mutation: MutationLike): string {
  if (mutation.type === 'patch') {
    return mutation.id
  }
  if (mutation.type === 'create') {
    return mutation.document._id
  }
  if (mutation.type === 'delete') {
    return mutation.id
  }
  if (mutation.type === 'createIfNotExists') {
    return mutation.document._id
  }
  if (mutation.type === 'createOrReplace') {
    return mutation.document._id
  }
  throw new Error('Invalid mutation type')
}
