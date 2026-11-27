import {css} from '#styled-system/css'

export const media = css({
  'borderRadius': '0.25rem',
  'padding': 0,
  // The svg is rendered by the workspace's icon component, so it is targeted from the root.
  '& svg': {
    width: '100%',
    height: '100%',
    borderRadius: 'inherit',
  },
})

export const mediaSize = {
  small: css({
    width: '25px',
    height: '25px',
  }),
  large: css({
    width: '41px',
    height: '41px',
  }),
}
