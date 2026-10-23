import {css} from '#styled-system/css'

export const root = css({
  position: 'relative',
})

export const styledCard = css({
  height: '100%',
})

export const overlay = css({
  'display': 'flex',
  'flexDirection': 'column',
  'alignItems': 'center',
  'justifyContent': 'center',
  'top': '-2px',
  'left': '-2px',
  'right': '-2px',
  'bottom': '-2px',
  'backgroundColor': 'var(--card-bg-color)',
  'opacity': 0.8,
  // `&&`: Layer sets `position: relative` itself
  '&&': {
    position: 'absolute',
  },
})
