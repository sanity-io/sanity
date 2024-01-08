import {CommentReactionOption, CommentReactionShortNames} from './types'

// These should not be alphabetized as the current order is intentional
export const COMMENT_REACTION_OPTIONS: CommentReactionOption[] = [
  {
    shortName: ':eyes:',
    title: 'Eyes',
  },
  {
    shortName: ':+1:',
    title: 'Thumbs up',
  },
  {
    shortName: ':rocket:',
    title: 'Rocket',
  },
  {
    shortName: ':heart_eyes:',
    title: 'Heart eyes',
  },
  {
    shortName: ':heavy_plus_sign:',
    title: 'Heavy plus sign',
  },
  {
    shortName: ':-1:',
    title: 'Thumbs down',
  },
]

export const COMMENT_REACTION_EMOJIS: Record<CommentReactionShortNames, string> = {
  ':eyes:': '👀',
  ':heart_eyes:': '😍',
  ':+1:': '👍',
  ':-1:': '👎',
  ':heavy_plus_sign:': '➕',
  ':rocket:': '🚀',
}
