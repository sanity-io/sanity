import {css} from '#styled-system/css'

// Resets the `white-space: nowrap` inherited from the surrounding MenuItem so the path and message
// wrap. Text sets no `white-space` of its own on the root, so a single class is enough.
export const wrappingText = css({
  whiteSpace: 'initial',
})
