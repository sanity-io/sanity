import type {TransactionLogMutation} from '../transactionLog'
import type {
  CreateIfNotExistsMutation,
  CreateMutation,
  CreateOrReplaceMutation,
  DeleteMutation,
  Mutation,
  PatchMutation,
} from './types'

/** @internal */
export function isCreateMutation(
  mutation: Mutation | TransactionLogMutation
): mutation is CreateMutation {
  return 'create' in mutation
}

/** @internal */
export function isCreateIfNotExistsMutation(
  mutation: Mutation | TransactionLogMutation
): mutation is CreateIfNotExistsMutation {
  return 'createIfNotExists' in mutation
}

/** @internal */
export function isCreateOrReplaceMutation(
  mutation: Mutation | TransactionLogMutation
): mutation is CreateOrReplaceMutation {
  return 'createOrReplace' in mutation
}

/** @internal */
export function isDeleteMutation(
  mutation: Mutation | TransactionLogMutation
): mutation is DeleteMutation {
  return 'delete' in mutation
}

/** @internal */
export function isPatchMutation(
  mutation: Mutation | TransactionLogMutation
): mutation is PatchMutation {
  return 'patch' in mutation
}
