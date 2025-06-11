import {type ValidationMarker} from '@sanity/types'

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

export interface ScheduleFilter {
  state: ScheduleState
  title: string
}

export interface ScheduleFormData {
  date: string
}

export interface ValidationStatus {
  isValidating: boolean
  validation: ValidationMarker[]
}

/**
 * key is schedule.id, NOT documentId
 */
export type ScheduledDocValidations = Record<string, ValidationStatus>
