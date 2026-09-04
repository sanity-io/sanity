import {style} from '@vanilla-extract/css'

/**
 * Horizontal scroll only. Avoid `overflow-x: auto` on `pre`: CSS pairs it with
 * `overflow-y: auto`, which spuriously shows a vertical scrollbar in flex layouts.
 */
export const codeWrapper = style({
  maxWidth: '100%',
  minWidth: 0,
  overflowX: 'auto',
  overflowY: 'hidden',
})
