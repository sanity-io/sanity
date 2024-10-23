import {type ColorHueKey} from '@sanity/color'
import {type IconSymbol} from '@sanity/icons'
import {type Dispatch} from 'react'
import {type Observable} from 'rxjs'

import {type PartialExcept} from '../../util'
import {type RELEASE_DOCUMENT_TYPE} from './constants'
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
 * @internal
 */
export interface ReleaseDocument {
  /**
   * typically
   * _.releases.<name>
   */
  _id: string
  _type: typeof RELEASE_DOCUMENT_TYPE
  _createdAt: string
  _updatedAt: string
  name: string
  createdBy: string
  state: ReleaseState
  finalDocumentStates?: ReleaseFinalDocumentState[]
  publishAt?: string
  metadata: {
    title: string
    description?: string
    hue?: ColorHueKey
    icon?: IconSymbol

    intendedPublishAt?: string
    // todo: the below properties should probably live at the system document
    createdBy?: string
    publishedBy?: string
    releaseType: ReleaseType
    archivedAt?: string
    archivedBy?: string
  }
}

/**
 * @internal
 */
export type EditableReleaseDocument = Omit<
  PartialExcept<ReleaseDocument, '_id'>,
  'metadata' | '_type'
> & {
  metadata: Partial<ReleaseDocument['metadata']>
}

/**
 * @internal
 */
export function isReleaseDocument(doc: unknown): doc is ReleaseDocument {
  return typeof doc === 'object' && doc !== null && '_type' in doc && doc._type === 'release'
}

/**
 * @internal
 */
export interface ReleaseStore {
  state$: Observable<ReleasesReducerState>
  getMetadataStateForSlugs$: (slugs: string[]) => Observable<MetadataWrapper>
  dispatch: Dispatch<ReleasesReducerAction>
}
