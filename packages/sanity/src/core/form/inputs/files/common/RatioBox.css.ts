import {css} from '#styled-system/css'

/** `calc(1 / ratio * 100%)`, computed from the `ratio` prop in the `RatioBox` wrapper */
export const ratioBoxPaddingBottomVar = '--ratio-box-padding-bottom'

/** `${padding}px`, mirrored from the `padding` prop in the `RatioBox` wrapper */
export const ratioBoxChildInsetVar = '--ratio-box-child-inset'

export const ratioBox = css({
  // `&&`: the ui5 Box sets `position`/`padding*` through its own utility classes
  '&&': {
    position: 'relative',
    paddingBottom: `var(${ratioBoxPaddingBottomVar})`,
  },
  '& > div': {
    position: 'absolute',
    top: `var(${ratioBoxChildInsetVar})`,
    left: `var(${ratioBoxChildInsetVar})`,
    right: `var(${ratioBoxChildInsetVar})`,
    bottom: `var(${ratioBoxChildInsetVar})`,
  },
})
