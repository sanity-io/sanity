import type {Mutation} from '../mutations'
import type {CreateSquashedMutation, TransactionLogMutation} from './types'

/** @internal */
export function isCreateSquashedMutation(
  mutation: Mutation | TransactionLogMutation,
): mutation is CreateSquashedMutation {
  return 'createSquashed' in mutation
}
