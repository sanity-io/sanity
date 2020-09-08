export {Doc} from '../../types'

export type MendozaPatch = unknown[]

export type MendozaEffectPair = {
  apply: MendozaPatch
  revert: MendozaPatch
}

// An "action" represent a single action which can be applied to a document.
// It has information about the patches to apply to the draft and/or published version,
// and what type of action it was.
//
// Be aware that `create` is not a separate action. If you're interested in this
// you need to check if the previous action was a `delete` action.

export {RemoteMutationWithVersion} from '@sanity/base/lib/datastores/document/document-pair/remoteMutations'

export type Transaction = {
  index: number
  id: string
  author: string
  timestamp: string
  draftEffect?: MendozaEffectPair
  publishedEffect?: MendozaEffectPair
}

export type TransactionLogEvent = {
  id: string
  timestamp: string
  author: string
  documentIDs: string[]
  effects: Record<string, MendozaEffectPair>
}
