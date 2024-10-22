import {type ColorHueKey} from '@sanity/color'
import {type IconSymbol} from '@sanity/icons'
import {type SanityDocument} from '@sanity/types'
import {type Dispatch} from 'react'
import {type Observable} from 'rxjs'

import {type PartialExcept} from '../../util'
import {type MetadataWrapper} from './createReleaseMetadataAggregator'
import {type ReleasesReducerAction, type ReleasesReducerState} from './reducer'

/** @internal */
export type releaseType = 'asap' | 'scheduled' | 'undecided'

/**
 * @internal
 */
export interface ReleaseDocument
  extends Pick<SanityDocument, '_id' | '_createdAt' | '_updatedAt' | '_rev' | '_version'> {
  _type: 'release'
  title: string
  archived?: boolean
  description?: string
  hue: ColorHueKey
  icon: IconSymbol
  authorId: string
  publishedAt?: string
  publishedBy?: string
  releaseType: releaseType
  archivedAt?: string
  archivedBy?: string
}

/**
 * @internal
 */
export type FormReleaseDocument = PartialExcept<ReleaseDocument, '_id' | '_type'>

/**
 * @internal
 */
export function isReleaseDocument(doc: unknown): doc is ReleaseDocument {
  return typeof doc === 'object' && doc !== null && '_type' in doc && doc._type === 'release'
}

/**
 * @internal
 */
export interface ReleasesStore {
  state$: Observable<ReleasesReducerState>
  getMetadataStateForSlugs$: (slugs: string[]) => Observable<MetadataWrapper>
  dispatch: Dispatch<ReleasesReducerAction>
}
