export type Mutation = {
  create: any
  delete: any
  createIfNotExists: any
  createOrReplace: any
  patch: any
}

export type HistoryEvent = {
  type: 'created' | 'edited' | 'published' | 'unpublished' | 'unknown'
  userIds: string[]
  startTime: Date
  endTime: Date,
  documentIDs: string[]
  rev: string
}

export type Transaction = {
  id: string
  author: string
  mutations: Mutation[]
  documentIDs: string[]
  timestamp: string
}
