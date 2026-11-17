import {css, firstThatWorks} from '#styled-system/css'

export const root = css({
  // `clip` with `hidden` as the fallback for browsers that do not support it.
  overflow: firstThatWorks('clip', 'hidden'),
})
