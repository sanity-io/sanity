import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const borderColorVar = createVar()

export const root = style({
  selectors: {
    '&&': {
      lineHeight: 0,
      position: 'sticky',
      top: 0,
    },
    '&&:not([data-collapsed]):after': {
      content: "''",
      display: 'block',
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: '-1px',
      borderBottom: `1px solid ${borderColorVar}`,
      opacity: 1,
    },
  },
})

export const layout = style({
  selectors: {
    '&&': {
      transformOrigin: 'calc(51px / 2)',
    },
  },
})

globalStyle(`[data-collapsed] > div > ${layout}`, {
  transform: 'rotate(90deg)',
})

export const titleCard = style({
  selectors: {
    '&&': {
      backgroundColor: 'var(--card-bg-color)',
    },
  },
})

globalStyle(`${titleCard} [data-ui='Text']`, {
  color: 'var(--card-fg-color)',
})

export const titleTextSkeleton = style({
  selectors: {
    '&&': {
      width: '66%',
      maxWidth: '175px',
    },
  },
})

export const titleText = style({
  selectors: {
    '&&': {
      cursor: 'default',
      outline: 'none',
    },
  },
})
