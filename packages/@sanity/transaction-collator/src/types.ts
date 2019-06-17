export type Mutation = {
  create?: {_id: string}
  createIfNotExists?: {_id: string}
  createOrReplace?: {_id: string}
  createSquashed?: {_id: string}
  delete?: {id: string}
  patch?: {_id: string}
}

export type HistoryEvent = {
  displayDocumentId?: string
  documentIDs: string[]
  endTime: Date,
  rev: string
  startTime: Date
  type: 'created' | 'edited' | 'published' | 'unpublished' | 'discardDraft' | 'truncated' | 'unknown'
  userIds: string[]
}

export type Transaction = {
  author: string
  documentIDs: string[]
  id: string
  mutations: Mutation[]
  timestamp: string
}
