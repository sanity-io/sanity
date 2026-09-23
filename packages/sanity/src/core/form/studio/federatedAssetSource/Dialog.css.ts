import {globalStyle, style} from '@vanilla-extract/css'

export const appDialog = style({
  selectors: {
    // `&&`: Dialog sets `padding` on its root itself (`padding` prop, default 3)
    '&&': {
      padding: '1.5rem',
    },
  },
})

globalStyle(`${appDialog} [data-ui='Card']:first-child`, {
  flex: 1,
})

export const fullSurfaceAppDialog = style({})

globalStyle(`${fullSurfaceAppDialog} [data-ui='DialogCard']`, {
  width: '100%',
  height: '100%',
  maxWidth: '2560px',
})
