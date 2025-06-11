export type ScheduleAction = 'publish' | 'unpublish'

export type ScheduleState = 'cancelled' | 'scheduled' | 'succeeded'

export type ScheduleSort = 'createdAt' | 'executeAt'

export interface Schedule {
  author: string
  action: ScheduleAction
  createdAt: string
  dataset: string
  description: string
  documents: {
    documentId: string
    documentType?: string
  }[]
  executeAt: string | null
  executedAt?: string
  id: string
  name: string
  projectId: string
  state: ScheduleState
  stateReason: string
}

export interface NormalizedTimeZone {
  abbreviation: string
  alternativeName: string
  city: string
  name: string
  namePretty: string
  offset: string
  value: string
}
