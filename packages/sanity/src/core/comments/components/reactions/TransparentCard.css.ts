import {style} from '@vanilla-extract/css'

/**
 * Style for a Card without a background.
 * This is a temporary workaround to force nested Sanity UI components to adhere to a specific tone (and bypass color mixing).
 *
 * TODO: consider exposing an unstable prop in Sanity UI to facilitate this.
 */
export const transparentCard = style({
  selectors: {
    '&&': {
      background: 'none',
    },
  },
})
