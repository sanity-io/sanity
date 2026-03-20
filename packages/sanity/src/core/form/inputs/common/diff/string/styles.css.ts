import {globalStyle, style} from '@vanilla-extract/css'

import {segment} from './segments.css'

export const stringDiffContainer = style({})

globalStyle(`${stringDiffContainer} del.${segment}`, {
  opacity: 0.5,
  textDecoration: 'line-through',
})

globalStyle(`${stringDiffContainer} del.${segment}::before`, {
  textDecoration: 'line-through',
  content: 'attr(data-text)',
})

globalStyle(`${stringDiffContainer} ins.${segment}`, {
  textDecoration: 'none',
})
