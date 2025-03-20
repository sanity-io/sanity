import {type SanityDocument} from '@sanity/types'
import {type Dispatch} from 'react'
import {type Observable} from 'rxjs'

import {type PartialExcept} from '../../util'
import {RELEASE_DOCUMENT_TYPE} from './constants'
import {type MetadataWrapper} from './createReleaseMetadataAggregator'
import {type ReleasesReducerAction, type ReleasesReducerState} from './reducer'

/**
 * @beta
 */
export const releaseTypes = ['asap', 'scheduled', 'undecided'] as const

/**
 * @beta
 */
export type ReleaseType = (typeof releaseTypes)[number]

/**
 * @beta
 */
export function isReleaseType(maybeReleaseType: unknown): maybeReleaseType is ReleaseType {
  return (
    typeof maybeReleaseType === 'string' && releaseTypes.includes(maybeReleaseType as ReleaseType)
  )
}

/**
 * @beta
 */
export type ReleaseState =
  | 'active'
  | 'archiving'
  | 'unarchiving'
  | 'archived'
  | 'published'
  | 'publishing'
  | 'scheduled'
  | 'scheduling'

/**
 * @beta
 */
export type ReleaseFinalDocumentState = {
  /** Document ID */
  id: string
}

/**
 * @beta
 */
export interface ReleaseDocument extends SanityDocument {
  /**
   * typically
   * `_.releases.<name>`
   */
  _id: string
  _type: typeof RELEASE_DOCUMENT_TYPE
  _createdAt: string
  _updatedAt: string
  _rev: string
  state: ReleaseState
  error?: {
    message: string
  }
  finalDocumentStates?: ReleaseFinalDocumentState[]
  /**
   * If defined, it takes precedence over the intendedPublishAt, the state should be 'scheduled'
   */
  publishAt?: string
  /**
   * If defined, it provides the time the release was actually published
   */
  publishedAt?: string
  metadata: {
    title: string
    description?: string

    intendedPublishAt?: string
    // todo: the below properties should probably live at the system document
    releaseType: ReleaseType
  }
}

/**
 * @internal
 */
export type EditableReleaseDocument = Omit<
  PartialExcept<ReleaseDocument, '_id'>,
  'metadata' | '_type'
> & {
  _id: string
  metadata: Partial<ReleaseDocument['metadata']>
}

/**
 * @internal
 */
export function isReleaseDocument(doc: unknown): doc is ReleaseDocument {
  return (
    typeof doc === 'object' && doc !== null && '_type' in doc && doc._type === RELEASE_DOCUMENT_TYPE
  )
}

/**
 * @internal
 */
export interface ReleaseStore {
  state$: Observable<ReleasesReducerState>
  /**
   * Counts all loaded release documents that are in an active state and have an error recorded.
   * This is determined by the presence of the `error` field in the release document.
   */
  errorCount$: Observable<number>
  getMetadataStateForSlugs$: (slugs: string[]) => Observable<MetadataWrapper>
  dispatch: Dispatch<ReleasesReducerAction>
}

/**
 * @internal
 */
export interface VersionInfoDocumentStub {
  _id: string
  _rev: string
  _createdAt: string
  _updatedAt: string
}
