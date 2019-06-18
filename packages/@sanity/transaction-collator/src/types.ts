export type Mutation = {
  create?: {_id: string}
  createIfNotExists?: {_id: string}
  createOrReplace?: {_id: string}
  createSquashed?: {_id: string}
  delete?: {id: string}
  patch?: {id: string}
}

export type EventType = 'created' | 'edited' | 'published' | 'unpublished' | 'discardDraft' | 'truncated' | 'unknown'

export type HistoryEvent = {
  displayDocumentId?: string
  documentIDs: string[]
  endTime: Date,
  rev: string
  startTime: Date
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
