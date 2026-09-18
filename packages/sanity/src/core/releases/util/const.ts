import {type ReleaseType} from '@sanity/client'
import {type BadgeTone} from '@sanity/ui'

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
 * The order release types are presented in, everywhere they are grouped.
 *
 * @internal
 */
export const ORDERED_RELEASE_TYPES: ReleaseType[] = ['asap', 'scheduled', 'undecided']

/**
 * @internal
 */
export const ARCHIVED_RELEASE_STATES = ['archived', 'published']

/**
 * @internal
 */
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
