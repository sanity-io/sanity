/*  TEMPORARY  DUMMY DATA */

/**
 * @internal
 */
export const RELEASETYPE = {
  asap: {
    name: 'asap',
    tone: 'critical',
  },
  scheduled: {
    name: 'scheduled',
    tone: 'primary',
  },
  undecided: {
    name: 'undecided',
    tone: 'default',
  },
} as const

/**
 * @internal
 */
export const LATEST = {
  // this exists implicitly
  _id: 'drafts',
  title: 'Latest',
  icon: undefined,
  hue: 'gray',
} as const

/**
 * @internal
 */
export const DEFAULT_RELEASE_TYPE = 'asap'
