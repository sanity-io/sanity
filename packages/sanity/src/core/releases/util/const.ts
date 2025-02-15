/*  TEMPORARY  DUMMY DATA */

import {type EditableReleaseDocument} from '../store/types'
import {createReleaseId} from './createReleaseId'

/**
 * @internal
 */
export const LATEST = 'drafts' as const

export const PUBLISHED = 'published' as const
/**
 * @internal
 */
export const DEFAULT_RELEASE_TYPE = 'asap'

export const ARCHIVED_RELEASE_STATES = ['archived', 'published']

export const DEFAULT_RELEASE: EditableReleaseDocument = {
  _id: createReleaseId(),
  metadata: {
    title: '',
    description: '',
    releaseType: DEFAULT_RELEASE_TYPE,
  },
}
