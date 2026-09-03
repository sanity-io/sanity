import {createVar, globalStyle, style} from '@vanilla-extract/css'

/** `calc(1 / ratio * 100%)`, computed from the `ratio` prop in the `RatioBox` wrapper */
export const ratioBoxPaddingBottomVar = createVar()

/** `${padding}px`, mirrored from the `padding` prop in the `RatioBox` wrapper */
export const ratioBoxChildInsetVar = createVar()

export const ratioBox = style({
  selectors: {
    // `&&`: the ui5 Box sets `position`/`padding*` through its own utility classes
    '&&': {
      position: 'relative',
      paddingBottom: ratioBoxPaddingBottomVar,
    },
  },
})

globalStyle(`${ratioBox} > div`, {
  position: 'absolute',
  top: ratioBoxChildInsetVar,
  left: ratioBoxChildInsetVar,
  right: ratioBoxChildInsetVar,
  bottom: ratioBoxChildInsetVar,
})
