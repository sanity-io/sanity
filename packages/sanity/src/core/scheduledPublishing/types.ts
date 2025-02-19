import {type ValidationMarker} from '@sanity/types'

export interface NormalizedTimeZone {
  abbreviation: string
  alternativeName: string
  mainCities: string
  name: string
  namePretty: string
  offset: string
  value: string
}

/**
 * @public
 */
export interface ScheduledPublishingPluginOptions {
  /**
   * Whether scheduled publishing is enabled for this workspace.
   */
  enabled: boolean
  /**
   * Date format to use for input fields. This must be a valid `date-fns` {@link https://date-fns.org/docs/format | formatted string}.
   * @defaultValue 'dd/MM/yyyy HH:mm' make sure to specify minutes and hours if you are specifying a custom format
   */
  inputDateTimeFormat?: string

  /**
   * @hidden
   * Whether scheduled publishing is enabled by the workspace.
   * Sanity is enabling it by default in the config, {@link "../scheduledPublishing/constants.ts"}
   */
  __internal__workspaceEnabled?: boolean
  /**
   * Whether to show the use releases warning banner in the tool.
   * @defaultValue true
   */
  showReleasesBanner?: boolean
}

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

export type ScheduleAction = 'publish' | 'unpublish'

export interface ScheduleFilter {
  state: ScheduleState
  title: string
}

export interface ScheduleFormData {
  date: string
}

export type ScheduleSort = 'createdAt' | 'executeAt'

export type ScheduleState = 'cancelled' | 'scheduled' | 'succeeded'

export interface ValidationStatus {
  isValidating: boolean
  validation: ValidationMarker[]
}

/**
 * key is schedule.id, NOT documentId
 */
export type ScheduledDocValidations = Record<string, ValidationStatus>
