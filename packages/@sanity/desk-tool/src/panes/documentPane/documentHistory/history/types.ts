import {RemoteSnapshotVersionEvent} from '@sanity/base/_internal'

export {DocumentRemoteMutationEvent} from '@sanity/base/_internal'
export {ChunkType, Chunk} from '@sanity/field/diff'
export {Doc} from '../../types'
export {RemoteSnapshotVersionEvent}

export type DocumentRemoteMutationVersionEvent = Exclude<
  RemoteSnapshotVersionEvent,
  {type: 'snapshot'}
>

export type MendozaPatch = unknown[]

export type Attributes = Record<string, unknown>

export type CombinedDocument = {
  draft: Attributes | null
  published: Attributes | null
}

export type MendozaEffectPair = {
  apply: MendozaPatch
  revert: MendozaPatch
}

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
