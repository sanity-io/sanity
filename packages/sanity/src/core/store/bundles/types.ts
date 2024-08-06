import {type ColorHueKey} from '@sanity/color'
import {type IconSymbol} from '@sanity/icons'
import {type SanityDocument} from '@sanity/types'
import {type Dispatch} from 'react'
import {type Observable} from 'rxjs'

import {type MetadataWrapper} from './createBundlesMetadataAggregator'
import {type bundlesReducerAction, type bundlesReducerState} from './reducer'

/**
 * @internal
 */
export interface BundleDocument extends SanityDocument {
  _type: 'bundle'
  title: string
  name: string
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
