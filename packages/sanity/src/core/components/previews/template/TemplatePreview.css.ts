import {css} from '#styled-system/css'

import {PREVIEW_SIZES} from '../constants'

export const root = css({
  // Box sets height on itself
  '&&': {
    height: '100%',
  },
  // Text sets `& a {text-decoration: none}` and `& a:hover {text-decoration: underline}` on itself;
  // the single class keeps the same specificity as before so the hover underline still applies
  '& a': {
    textDecoration: 'none',
  },
  // Text sets `& a {color: var(--card-link-color)}` on itself; the doubled class outranks it
  '&& a': {
    color: 'currentColor',
  },
  '& svg[data-sanity-icon]': {
    margin: 0,
  },
})

export const headerFlex = css({
  // Flex (Box) sets height on itself
  '&&': {
    height: `${PREVIEW_SIZES.default.media.height / 16}rem`,
  },
})

export const titleSkeleton = css({
  'maxWidth': `${160 / 16}rem`,
  // TextSkeleton sets its own dimensions
  '&&': {
    width: '80%',
  },
})

export const subtitleSkeleton = css({
  'maxWidth': `${120 / 16}rem`,
  // TextSkeleton sets its own dimensions
  '&&': {
    width: '60%',
  },
})
