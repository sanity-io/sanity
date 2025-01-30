import {type SanityDocument} from '@sanity/types'
import {type Dispatch} from 'react'
import {type Observable} from 'rxjs'

import {type PartialExcept} from '../../util'
import {RELEASE_DOCUMENT_TYPE} from './constants'
import {type MetadataWrapper} from './createReleaseMetadataAggregator'
import {type ReleasesReducerAction, type ReleasesReducerState} from './reducer'

/** @internal */
export type ReleaseType = 'asap' | 'scheduled' | 'undecided'

/**
 *@internal
 */
export type ReleaseState = 'active' | 'archived' | 'published' | 'scheduled' | 'scheduling'
/**
 *@internal
 */
export type ReleaseFinalDocumentState = {
  /** Document ID */
  id: string
  revisionId: string
}

/**
 * TODO: When made `beta`, update the PublishDocumentVersionEvent to use this type
 * @internal
 */
export interface ReleaseDocument extends SanityDocument {
  /**
   * typically
   * _.releases.<name>
   */
  _id: string
  _type: typeof RELEASE_DOCUMENT_TYPE
  _createdAt: string
  _updatedAt: string
  _rev: string
  state: ReleaseState
  finalDocumentStates?: ReleaseFinalDocumentState[]
  /**
   * If defined, it takes precedence over the intendedPublishAt, the state should be 'scheduled'
   */
  publishAt?: string
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
  getMetadataStateForSlugs$: (slugs: string[]) => Observable<MetadataWrapper>
  dispatch: Dispatch<ReleasesReducerAction>
}
