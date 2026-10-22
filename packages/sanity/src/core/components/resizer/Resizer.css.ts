import {css} from '#styled-system/css'

const baseRaw = css.raw({
  'position': 'absolute',
  'top': 0,
  'bottom': 0,
  'width': '9px',
  'zIndex': 201,
  'cursor': 'ew-resize',
  // Border
  '& > span:nth-child(1)': {
    display: 'block',
    borderLeft: '1px solid var(--card-border-color)',
    position: 'absolute',
    top: 0,
    bottom: 0,
    transition: 'opacity 200ms',
  },
  // Hover effect
  '& > span:nth-child(2)': {
    display: 'block',
    position: 'absolute',
    top: 0,
    width: '9px',
    bottom: 0,
    backgroundColor: 'var(--card-border-color)',
    opacity: 0,
    transition: 'opacity 150ms',
  },
  '&:hover > span:nth-child(2)': {
    '@media (hover: hover)': {
      opacity: 0.2,
    },
  },
})

const base = css(baseRaw)

export const root = {
  right: css(baseRaw, {
    'right': '-4px',
    '& > span:nth-child(1)': {
      right: '4px',
    },
    '& > span:nth-child(2)': {
      right: '0px',
    },
  }),
  left: css(baseRaw, {
    'left': '-4px',
    '& > span:nth-child(1)': {
      left: '4px',
    },
    '& > span:nth-child(2)': {
      left: '0px',
    },
  }),
}
