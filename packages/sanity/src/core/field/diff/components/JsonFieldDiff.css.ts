import {css} from '#styled-system/css'

/**
 * Horizontal scroll only. Avoid `overflow-x: auto` on `pre`: CSS pairs it with
 * `overflow-y: auto`, which spuriously shows a vertical scrollbar in flex layouts.
 */
export const codeWrapper = css({
  maxWidth: '100%',
  minWidth: 0,
  overflowX: 'auto',
  overflowY: 'hidden',
})
