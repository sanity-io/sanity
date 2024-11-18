/*  TEMPORARY  DUMMY DATA */

import {DRAFTS_PERSPECTIVE} from './perspective'

/**
 * @internal
 */
export const LATEST = {
  // this exists implicitly
  _id: DRAFTS_PERSPECTIVE,
  metadata: {
    title: 'Latest',
  },
} as const

/**
 * @internal
 */
export const DEFAULT_RELEASE_TYPE = 'asap'
