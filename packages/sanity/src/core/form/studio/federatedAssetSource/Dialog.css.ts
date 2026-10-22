import {css} from '#styled-system/css'

export const appDialog = css({
  // `&&`: Dialog sets `padding` on its root itself (`padding` prop, default 3)
  '&&': {
    padding: '1.5rem',
  },
  "& [data-ui='Card']:first-child": {
    flex: 1,
  },
})

export const fullSurfaceAppDialog = css({
  "& [data-ui='DialogCard']": {
    width: '100%',
    height: '100%',
    maxWidth: '2560px',
  },
})
