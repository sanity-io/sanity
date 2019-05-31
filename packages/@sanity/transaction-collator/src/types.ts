export type Mutation = {
  create: any
  delete: any
  createIfNotExists: any
  createOrReplace: any
  patch: any
}

export type HistoryEvent = {
  type: 'created' | 'edited' | 'published' | 'unpublished' | 'unknown'
  rev: string
  userIds: string[]
  startTime: Date
  endTime: Date
}

export type Transaction = {
  namespace: string
  id: string
  author: string
  mutations: Mutation[]
  documentIDs: string[]
  timestamp: string
}
