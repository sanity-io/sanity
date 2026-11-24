import {css} from '#styled-system/css'

export const codeWrapper = css({
  'position': 'relative',
  'width': '100%',
  '& code': {
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    position: 'relative',
    maxWidth: '200px',
    color: 'var(--card-code-fg-color)',
    background: 'var(--card-code-bg-color)',
  },
})
