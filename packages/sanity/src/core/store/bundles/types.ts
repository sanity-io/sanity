import {type ColorHueKey} from '@sanity/color'
import {type IconSymbol} from '@sanity/icons'
import {type Dispatch} from 'react'
import {type Observable} from 'rxjs'

import {type MetadataWrapper} from './createBundlesMetadataAggregator'
import {type bundlesReducerAction, type bundlesReducerState} from './reducer'

/**
 * @internal
 */
export interface BundleDocument {
  _type: 'bundle'
  title: string
  slug: string
  description?: string
  hue: ColorHueKey
  icon: IconSymbol
  authorId: string
  publishedAt?: string
  archivedAt?: string
  publishedBy?: string

  _id: string
  _createdAt: string
  _updatedAt: string
  _rev: string
  _version?: Record<string, never>
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
