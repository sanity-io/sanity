import {globalStyle, style} from '@vanilla-extract/css'

export const strong = style({
  fontWeight: 600,
})

export const noWrap = style({
  whiteSpace: 'nowrap',
})

export const linkWrapper = style({})

globalStyle(`${linkWrapper} > a`, {
  color: 'var(--card-fg-muted-color)',
  textDecoration: 'underline',
  textUnderlineOffset: '1px',
  fontWeight: 600,
})
