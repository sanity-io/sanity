import {css} from '#styled-system/css'

export const codeWrapper = css({
  'position': 'relative',
  'width': '100%',
  '& code': {
    color: 'var(--card-code-fg-color)',
    background: 'var(--card-code-bg-color)',
  },
})
