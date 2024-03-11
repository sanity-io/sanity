import {
  type Mutation,
  type NodePatch,
  type Transaction,
} from '../../mutations/types'
import {stringify as stringifyPath} from '../../path/parser/stringify'

export function encode(mutation: Mutation) {
  return encodeMutation(mutation)
}

export function encodeAll(mutations: Mutation[]) {
  return mutations.flatMap(encode)
}

export function encodeTransaction(transaction: Transaction) {
  return {
    transactionId: transaction.id,
    mutations: encodeAll(transaction.mutations),
  }
}

export function encodeMutation(mutation: Mutation) {
  if (
    mutation.type === 'create' ||
    mutation.type === 'createIfNotExists' ||
    mutation.type === 'createOrReplace'
  ) {
    return {[mutation.type]: mutation.document}
  }
  if (mutation.type === 'delete') {
    return {
      delete: {id: mutation.id},
    }
  }
  const ifRevisionID = mutation.options?.ifRevision
  return mutation.patches.map(patch => {
    return {
      patch: {
        id: mutation.id,
        ...(ifRevisionID && {ifRevisionID}),
        ...patchToSanity(patch),
      },
    }
  })
}

function patchToSanity(patch: NodePatch) {
  const {path, op} = patch
  if (op.type === 'unset') {
    return {unset: [stringifyPath(path)]}
  }
  if (op.type === 'insert') {
    return {
      insert: {
        [op.position]: stringifyPath([...path, op.referenceItem]),
        items: op.items,
      },
    }
  }
  if (op.type === 'diffMatchPatch') {
    return {diffMatchPatch: {[stringifyPath(path)]: op.value}}
  }
  if (op.type === 'inc') {
    return {inc: {[stringifyPath(path)]: op.amount}}
  }
  if (op.type === 'dec') {
    return {dec: {[stringifyPath(path)]: op.amount}}
  }
  if (op.type === 'set' || op.type === 'setIfMissing') {
    return {[op.type]: {[stringifyPath(path)]: op.value}}
  }
  if (op.type === 'truncate') {
    const range = [
      op.startIndex,
      typeof op.endIndex === 'number' ? op.endIndex : '',
    ].join(':')

    return {unset: [`${stringifyPath(path)}[${range}]`]}
  }
  if (op.type === 'upsert') {
    // note: upsert currently not supported by sanity, so will always insert at reference position
    return {
      unset: op.items.map(item =>
        stringifyPath([...path, {_key: (item as any)._key}]),
      ),
      insert: {
        [op.position]: stringifyPath([...path, op.referenceItem]),
        items: op.items,
      },
    }
  }
  if (op.type === 'assign') {
    return {
      set: Object.fromEntries(
        Object.keys(op.value).map(key => [
          stringifyPath(path.concat(key)),
          op.value[key as keyof typeof op.value],
        ]),
      ),
    }
  }
  if (op.type === 'unassign') {
    return {
      unset: op.keys.map(key => stringifyPath(path.concat(key))),
    }
  }
  if (op.type === 'replace') {
    return {
      insert: {
        replace: stringifyPath(path.concat(op.referenceItem)),
        items: op.items,
      },
    }
  }
  //@ts-expect-error all cases should be covered
  throw new Error(`Unknown operation type ${op.type}`)
}
