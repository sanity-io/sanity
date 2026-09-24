import {css} from '#styled-system/css'

export const panel = css({
  // Container sets `width: 100%` on its own class (0,1,0); the runtime-injected wrapper used to win
  // that tie by insertion order, so the class is doubled.
  '&&': {
    width: 'auto',
  },
})
