import {style} from '@vanilla-extract/css'

// Marker on ui5 `Icon` svgs. Block layout comes from ui5 (`sui-display-block`); negative margins trim
// standalone glyphs to cap height. v4 `Button`/`Chip` wrap icons in trimmed `Text`, which expects
// inline svgs — override ui5 block only in that subtree.
export const releaseAvatarIcon = style({
  selectors: {
    '[data-ui="Button"] [data-ui="Text"] &': {
      display: 'inline',
    },
  },
})
