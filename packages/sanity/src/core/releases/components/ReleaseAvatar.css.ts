import {css} from '#styled-system/css'

// Marker on ui5 `Icon` svgs. Block layout comes from ui5 (`sui-display-block`); negative margins trim
// standalone glyphs to cap height. v4 `Button`/`Chip` wrap icons in trimmed `Text`, which expects
// inline svgs — override ui5 block only in that subtree. A `MenuButton` trigger is the same v4
// button renamed `data-ui="MenuButton"`, so it is matched too: without it the icon sat 1px low in
// the document header's release pills.
export const releaseAvatarIcon = css({
  '[data-ui="Button"] [data-ui="Text"] &, [data-ui="MenuButton"] [data-ui="Text"] &': {
    display: 'inline',
  },
})
