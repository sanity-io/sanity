export type Mutation = {
  create: any
  createIfNotExists: any
  createOrReplace: any
  createSquashed: any
  delete: any
  patch: any
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
