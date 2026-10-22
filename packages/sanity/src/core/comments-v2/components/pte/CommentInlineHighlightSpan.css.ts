import {css} from '#styled-system/css'

const base = css.raw({
  boxSizing: 'border-box',
  transition: 'background-color 100ms ease, border-color 100ms ease',
})

// The hues are the static `@sanity/color` values of `COMMENTS_HIGHLIGHT_HUE_KEY` (`yellow`); only
// the light/dark pick depends on the theme.
/** Picked by `color._dark` */
export const highlightSpan = {
  light: css(base, {
    "&[data-inline-comment-state='added'][data-inline-comment-nested='false']": {
      // hues.yellow[100], hues.yellow[300]
      backgroundColor: '#fcf3bb',
      borderBottom: '2px solid #f7d455',
    },
    "&[data-inline-comment-state='added'][data-inline-comment-nested='true']": {
      // hues.yellow[200], hues.yellow[400]
      backgroundColor: '#f9e994',
      borderBottom: '2px solid #f9bc15',
    },
    "&[data-inline-comment-state='added'][data-inline-comment-nested='false'][data-hovered='true']":
      {
        // hues.yellow[200], hues.yellow[400]
        backgroundColor: '#f9e994',
        borderBottom: '2px solid #f9bc15',
      },
    // A comment being authored uses the same colors as an added one, for now
    "&[data-inline-comment-state='authoring']": {
      backgroundColor: '#fcf3bb',
      borderBottom: '2px solid #f7d455',
    },
    // Make sure that child elements appropriately blend with the
    // background of the highlight span
    '& *': {
      mixBlendMode: 'multiply',
    },
  }),
  dark: css(base, {
    "&[data-inline-comment-state='added'][data-inline-comment-nested='false']": {
      // hues.yellow[800], hues.yellow[700]
      backgroundColor: '#3b220c',
      borderBottom: '2px solid #653a0b',
    },
    "&[data-inline-comment-state='added'][data-inline-comment-nested='true']": {
      // hues.yellow[700], hues.yellow[600]
      backgroundColor: '#653a0b',
      borderBottom: '2px solid #965908',
    },
    "&[data-inline-comment-state='added'][data-inline-comment-nested='false'][data-hovered='true']":
      {
        // hues.yellow[700], hues.yellow[600]
        backgroundColor: '#653a0b',
        borderBottom: '2px solid #965908',
      },
    // A comment being authored uses the same colors as an added one, for now
    "&[data-inline-comment-state='authoring']": {
      backgroundColor: '#3b220c',
      borderBottom: '2px solid #653a0b',
    },
    // Make sure that child elements appropriately blend with the
    // background of the highlight span
    '& *': {
      mixBlendMode: 'screen',
    },
  }),
}
