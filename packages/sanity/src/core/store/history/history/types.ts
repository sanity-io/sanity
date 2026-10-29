import {type MendozaEffectPair} from '@sanity/types'

import {type RemoteSnapshotVersionEvent} from '../../document/document-pair/checkoutPair'

/**
 * @deprecated Use the events API instead. The legacy document timeline will be removed in the next major version.
 * @hidden
 * @beta */
export type DocumentRemoteMutationVersionEvent = Exclude<
  RemoteSnapshotVersionEvent,
  {type: 'snapshot'}
>

/**
 * @deprecated Use the events API instead. The legacy document timeline will be removed in the next major version.
 * @hidden
 * @beta */
export interface CombinedDocument {
  draft: Record<string, unknown> | null
  published: Record<string, unknown> | null
}

/**
 * @deprecated Use the events API instead. The legacy document timeline will be removed in the next major version.
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
