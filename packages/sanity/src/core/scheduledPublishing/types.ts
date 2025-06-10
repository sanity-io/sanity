import {type ValidationMarker} from '@sanity/types'

import {type ScheduleState} from '../studio/timezones/types'

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
