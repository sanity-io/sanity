import {type Mutation} from './types'

export interface Transaction {
  type: 'transaction'
  id?: string
  mutations: Mutation[]
}
export function transaction(id: string, mutations: Mutation[]): Transaction
export function transaction(mutations: Mutation[]): Transaction
export function transaction(
  idOrMutations: string | Mutation[],
  _mutations?: Mutation[],
): Transaction {
  const [id, mutations] =
    typeof idOrMutations === 'string'
      ? [idOrMutations, _mutations as Mutation[]]
      : [undefined, idOrMutations as Mutation[]]
  return {type: 'transaction', id, mutations}
}
