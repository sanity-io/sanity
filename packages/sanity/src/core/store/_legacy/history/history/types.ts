import type {MendozaEffectPair} from '@sanity/types'
import type {RemoteSnapshotVersionEvent} from '../../document/document-pair/checkoutPair'

/**
 * @hidden
 * @beta */
export type DocumentRemoteMutationVersionEvent = Exclude<
  RemoteSnapshotVersionEvent,
  {type: 'snapshot'}
>

/**
 * @hidden
 * @beta */
export interface CombinedDocument {
  draft: Record<string, unknown> | null
  published: Record<string, unknown> | null
}

/**
 * @hidden
 * @beta */
export interface Transaction {
  index: number
  id: string
  author: string
  timestamp: string
  draftEffect?: MendozaEffectPair
  publishedEffect?: MendozaEffectPair
}
