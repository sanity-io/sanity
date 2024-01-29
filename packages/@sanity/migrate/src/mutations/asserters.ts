import {Mutation} from './types'
import {Transaction} from './transaction'

export function isMutation(mutation: unknown): mutation is Mutation {
  return (
    mutation !== null &&
    typeof mutation === 'object' &&
    'type' in mutation &&
    (mutation.type === 'create' ||
      mutation.type === 'createIfNotExists' ||
      mutation.type === 'createOrReplace' ||
      mutation.type === 'patch' ||
      mutation.type === 'delete')
  )
}

export function isTransaction(mutation: unknown): mutation is Transaction {
  return (
    mutation !== null &&
    typeof mutation === 'object' &&
    'type' in mutation &&
    mutation.type === 'transaction'
  )
}
