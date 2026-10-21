import {keyframes, style} from '@vanilla-extract/css'

const noticeIn = keyframes({
  from: {opacity: 0, transform: 'translateY(-6px)'},
  to: {opacity: 1, transform: 'none'},
})

/** Plays once when the publish-blocked notice is revealed at the top of the list. */
export const publishNotice = style({
  'marginBottom': '12px',
  '@media': {
    '(prefers-reduced-motion: no-preference)': {
      animation: `${noticeIn} 320ms ease-out forwards`,
    },
    '(prefers-reduced-motion: reduce)': {
      opacity: 1,
      transform: 'none',
    },
  },
})
