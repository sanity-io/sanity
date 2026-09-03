import {globalStyle, style} from '@vanilla-extract/css'

import {PREVIEW_SIZES} from '../constants'

export const root = style({
  selectors: {
    // Box sets height on itself
    '&&': {
      height: '100%',
    },
  },
})

// Text sets `& a {text-decoration: none}` and `& a:hover {text-decoration: underline}` on itself;
// the single class keeps the same specificity as before so the hover underline still applies
globalStyle(`${root} a`, {
  textDecoration: 'none',
})

// Text sets `& a {color: var(--card-link-color)}` on itself; the doubled class outranks it
globalStyle(`${root}${root} a`, {
  color: 'currentColor',
})

globalStyle(`${root} svg[data-sanity-icon]`, {
  margin: 0,
})

export const headerFlex = style({
  selectors: {
    // Flex (Box) sets height on itself
    '&&': {
      height: `${PREVIEW_SIZES.default.media.height / 16}rem`,
    },
  },
})

export const titleSkeleton = style({
  maxWidth: `${160 / 16}rem`,
  selectors: {
    // TextSkeleton sets its own dimensions
    '&&': {
      width: '80%',
    },
  },
})

export const subtitleSkeleton = style({
  maxWidth: `${120 / 16}rem`,
  selectors: {
    // TextSkeleton sets its own dimensions
    '&&': {
      width: '60%',
    },
  },
})
