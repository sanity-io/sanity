import {css} from '#styled-system/css'

export const agentAvatar = css({
  position: 'relative',
  display: 'inline-flex',
  verticalAlign: 'middle',
  lineHeight: 0,
})

export const agentBadge = css({
  'position': 'absolute',
  'bottom': '-2px',
  'right': '-2px',
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'center',
  'width': '0.75rem',
  'height': '0.75rem',
  'borderRadius': '50%',
  'backgroundColor': 'var(--card-bg-color)',
  'color': 'var(--card-fg-color)',
  'boxShadow': '0 0 0 1px var(--card-border-color)',
  '& svg': {width: '100%', height: '100%'},
})
