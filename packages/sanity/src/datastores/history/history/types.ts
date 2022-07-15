import type {MendozaEffectPair} from '@sanity/types'
import type {RemoteSnapshotVersionEvent} from '../../document/document-pair/checkoutPair'

export type {ChunkType, Chunk} from '../../../field'

export type DocumentRemoteMutationVersionEvent = Exclude<
  RemoteSnapshotVersionEvent,
  {type: 'snapshot'}
>

export interface CombinedDocument {
  draft: Record<string, unknown> | null
  published: Record<string, unknown> | null
}

export interface Transaction {
  index: number
  id: string
  author: string
  timestamp: string
  draftEffect?: MendozaEffectPair
  publishedEffect?: MendozaEffectPair
}
