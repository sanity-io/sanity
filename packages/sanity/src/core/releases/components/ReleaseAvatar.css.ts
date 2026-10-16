import {style} from '@vanilla-extract/css'

// `display` is set from a class (specificity 0,1,0) rather than inline on purpose. Standalone, the
// glyph is a block whose inline negative margin trims it to the cap height of the text it sits
// next to. Inside a v4 `@sanity/ui` `Text` — including the one v4 `Button` wraps its `icon` in —
// the Text's `& svg { display: inline }` rule (0,1,1) wins and keeps laying the glyph out as an
// inline icon on the text baseline, which is what centres it in the button.
export const releaseAvatarIcon = style({display: 'block'})
