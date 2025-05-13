import {type ReleaseDocument, type ReleaseType} from '@sanity/client'
import {type Dispatch} from 'react'
import {type Observable} from 'rxjs'

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
export function isReleaseType(maybeReleaseType: unknown): maybeReleaseType is ReleaseType {
  return (
    typeof maybeReleaseType === 'string' && releaseTypes.includes(maybeReleaseType as ReleaseType)
  )
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
