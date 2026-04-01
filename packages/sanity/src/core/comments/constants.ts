import {type ColorHueKey} from '@sanity/color'

import {type CommentReactionOption, type CommentReactionShortNames} from './types'

/**
 * @internal
 * @hidden
 */
export const COMMENTS_INSPECTOR_NAME = 'sanity/comments'

export const COMMENTS_HIGHLIGHT_HUE_KEY: ColorHueKey = 'yellow'

/**
 * Top-level document field where inline-comment range anchors are stored.
 * Change this value to relocate the range data (e.g. to `'_system'` + nested
 * `'ranges'` once the Content Lake schema supports it on every document).
 *
 * @internal
 */
export const COMMENT_RANGES_FIELD = 'commentRanges'

// These should not be alphabetized as the current order is intentional
export const COMMENT_REACTION_OPTIONS: CommentReactionOption[] = [
  {
    shortName: ':+1:',
    title: 'Thumbs up',
  },
  {
    shortName: ':-1:',
    title: 'Thumbs down',
  },
  {
    shortName: ':heart:',
    title: 'Heart',
  },
  {
    shortName: ':rocket:',
    title: 'Rocket',
  },
  {
    shortName: ':heavy_plus_sign:',
    title: 'Heavy plus sign',
  },
  {
    shortName: ':eyes:',
    title: 'Eyes',
  },
]

export const COMMENT_REACTION_EMOJIS: Record<CommentReactionShortNames, string> = {
  ':-1:': '👎',
  ':+1:': '👍',
  ':eyes:': '👀',
  ':heart:': '❤️',
  ':heavy_plus_sign:': '➕',
  ':rocket:': '🚀',
}
