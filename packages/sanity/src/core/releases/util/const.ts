import {type BadgeTone} from '@sanity/ui'

import {type ReleaseType} from '../store/types'

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

export const RELEASE_TYPES_TONES: Record<ReleaseType, {tone: BadgeTone}> = {
  asap: {
    tone: 'caution',
  },
  scheduled: {
    tone: 'suggest',
  },
  undecided: {
    tone: 'neutral',
  },
}
