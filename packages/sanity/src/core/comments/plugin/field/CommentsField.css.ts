import {css} from '#styled-system/css'

/** `radius[3]` (v1 `theme.sanity.radius[3]`) */
export const radius3Var = '--comments-field-radius-3'
/** `space[2]` (v1 `theme.sanity.space[2]`), with unit */
export const space2Var = '--comments-field-space-2'

const highlightBase = css.raw({
  borderRadius: `var(${radius3Var})`,
  top: `calc(-1 * var(${space2Var}))`,
  left: `calc(-1 * var(${space2Var}))`,
  bottom: `calc(-1 * var(${space2Var}))`,
  right: `calc(-1 * var(${space2Var}))`,
  pointerEvents: 'none',
  position: 'absolute',
  zIndex: 1,
  width: `calc(100% + var(${space2Var}) * 2)`,
  height: `calc(100% + var(${space2Var}) * 2)`,
})

// The hues are the static `@sanity/color` values of `COMMENTS_HIGHLIGHT_HUE_KEY` (`yellow`); only
// the light/dark pick depends on the theme.
/** Picked by `color._dark` (v1 `theme.sanity.color.dark`) */
export const highlightDiv = {
  light: css(highlightBase, {
    mixBlendMode: 'multiply',
    // hues.yellow[50]
    backgroundColor: '#fefae1',
  }),
  dark: css(highlightBase, {
    mixBlendMode: 'screen',
    // hues.yellow[900]
    backgroundColor: '#271a11',
  }),
}

export const fieldStack = css({
  'position': 'relative',
  // Hide when the field component renders nothing (e.g. a custom
  // field component that returns null) to avoid an empty wrapper
  // taking up space in the form.
  '&&:empty:not([hidden])': {
    display: 'none',
  },
})
