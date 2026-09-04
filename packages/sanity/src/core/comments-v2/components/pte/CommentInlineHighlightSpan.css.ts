import {hues} from '@sanity/color'
import {globalStyle, style, type StyleRule, styleVariants} from '@vanilla-extract/css'

import {COMMENTS_HIGHLIGHT_HUE_KEY} from '../../constants'

const base = style({
  boxSizing: 'border-box',
  transition: 'background-color 100ms ease, border-color 100ms ease',
})

function highlightColors(isDark: boolean): StyleRule {
  const hue = hues[COMMENTS_HIGHLIGHT_HUE_KEY]

  // Colors used when a comment is added
  const addedBg = hue[isDark ? 800 : 100].hex
  const addedBorder = hue[isDark ? 700 : 300].hex

  const addedHoverBg = hue[isDark ? 700 : 200].hex
  const addedHoverBorder = hue[isDark ? 600 : 400].hex

  // Colors used when a comment is added and it is a nested comment
  const addedNestedBg = hue[isDark ? 700 : 200].hex
  const addedNesterBorder = hue[isDark ? 600 : 400].hex

  // Colors used when a comment is being authored.
  // For now, we use the same colors as when a comment is added.
  const authoringBg = addedBg
  const authoringBorder = addedBorder

  return {
    selectors: {
      "&[data-inline-comment-state='added'][data-inline-comment-nested='false']": {
        backgroundColor: addedBg,
        borderBottom: `2px solid ${addedBorder}`,
      },

      "&[data-inline-comment-state='added'][data-inline-comment-nested='true']": {
        backgroundColor: addedNestedBg,
        borderBottom: `2px solid ${addedNesterBorder}`,
      },

      "&[data-inline-comment-state='added'][data-inline-comment-nested='false'][data-hovered='true']":
        {
          backgroundColor: addedHoverBg,
          borderBottom: `2px solid ${addedHoverBorder}`,
        },

      "&[data-inline-comment-state='authoring']": {
        backgroundColor: authoringBg,
        borderBottom: `2px solid ${authoringBorder}`,
      },
    },
  }
}

export const highlightSpan = styleVariants({
  light: [base, highlightColors(false)],
  dark: [base, highlightColors(true)],
})

// Make sure that child elements appropriately blend with the
// background of the highlight span
globalStyle(`${highlightSpan.light} *`, {
  mixBlendMode: 'multiply',
})

globalStyle(`${highlightSpan.dark} *`, {
  mixBlendMode: 'screen',
})
