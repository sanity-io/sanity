import {css} from '#styled-system/css'

export const root = css({
  'position': 'absolute',
  'width': '18px',
  'height': '18px',
  'background': 'var(--card-bg-color)',
  'bottom': '-4px',
  'right': '-4px',
  'borderRadius': '50%',
  'display': 'flex',
  'justifyContent': 'center',
  'alignItems': 'center',
  'border': '1px solid var(--card-bg-color)',
  'boxSizing': 'content-box',
  '& svg': {
    boxSizing: 'content-box',
    border: '1px solid var(--card-hairline-soft-color)',
    borderRadius: '50%',
    padding: '2px',
    width: '12px',
    height: '12px',
  },
  "&[data-logo='github'] svg path": {
    fill: 'var(--card-fg-color)',
  },
  "&[data-logo='saml'] svg path": {
    fill: 'var(--card-fg-color)',
  },
})
