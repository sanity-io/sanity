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
  // PROPOSED: neutral, as releases take the neutral tone; purple (suggest) is the variants' colour, and the two clashed side by side.
  scheduled: {
    tone: 'neutral',
  },
  undecided: {
    tone: 'neutral',
  },
}
