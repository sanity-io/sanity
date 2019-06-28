export type Mutation = {
  create?: {_id: string}
  createIfNotExists?: {_id: string}
  createOrReplace?: {_id: string}
  createSquashed?: {_id: string, authors: string[], document: {_id: string}}
  delete?: {id: string}
  patch?: {id: string}
}

export type EventType = 'created' | 'edited' | 'published' | 'unpublished' | 'discardDraft' | 'truncated' | 'deleted' | 'restored' | 'unknown'

export type HistoryEvent = {
  displayDocumentId: string | null
  documentIDs: string[]
  endTime: string,
  rev: string
  startTime: string
  transactionIds: string[]
  type: EventType
  userIds: string[]
}

export type Transaction = {
  author: string
  documentIDs: string[]
  id: string
  mutations: Mutation[]
  timestamp: string
}
