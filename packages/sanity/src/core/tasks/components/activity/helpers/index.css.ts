import {css} from '#styled-system/css'

export const strong = css({
  fontWeight: 600,
})

export const noWrap = css({
  whiteSpace: 'nowrap',
})

export const linkWrapper = css({
  '&& > a': {
    color: 'var(--card-fg-muted-color)',
    textDecoration: 'underline',
    textUnderlineOffset: '1px',
    fontWeight: 600,
  },
})
