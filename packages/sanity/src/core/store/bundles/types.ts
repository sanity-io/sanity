import {type ColorHueKey} from '@sanity/color'
import {type IconSymbol} from '@sanity/icons'
import {type SanityDocument} from '@sanity/types'
import {type Dispatch} from 'react'
import {type Observable} from 'rxjs'

import {type PartialExcept} from '../../util'
import {type MetadataWrapper} from './createBundlesMetadataAggregator'
import {type bundlesReducerAction, type bundlesReducerState} from './reducer'

/**
 * @internal
 */
export interface BundleDocument
  extends Pick<SanityDocument, '_id' | '_createdAt' | '_updatedAt' | '_rev' | '_version'> {
  _type: 'bundle'
  title: string
  description?: string
  hue: ColorHueKey
  icon: IconSymbol
  authorId: string
  publishedAt?: string
  archivedAt?: string
  publishedBy?: string
}

/**
 * @internal
 */
export type FormBundleDocument = PartialExcept<BundleDocument, '_id' | '_type'>

/**
 * @internal
 */
export function isBundleDocument(doc: unknown): doc is BundleDocument {
  return typeof doc === 'object' && doc !== null && '_type' in doc && doc._type === 'bundle'
}

/**
 * @internal
 */
export interface BundlesStore {
  state$: Observable<bundlesReducerState>
  getMetadataStateForSlugs$: (slugs: string[]) => Observable<MetadataWrapper>
  dispatch: Dispatch<bundlesReducerAction>
}
