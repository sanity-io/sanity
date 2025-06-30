import {type ReleaseType} from '@sanity/client'
import {type ElementTone} from '@sanity/ui/theme'

/**
 * @internal
 */
export const LATEST = 'drafts' as const

/**
 * @internal
 */
export const PUBLISHED = 'published' as const

/**
 * @internal
 */
export const DEFAULT_RELEASE_TYPE = 'asap'

/**
 * @internal
 */
export const ARCHIVED_RELEASE_STATES = ['archived', 'published']

/**
 * @internal
 */
export const RELEASE_TYPES_TONES: Record<ReleaseType, {tone: ElementTone}> = {
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
