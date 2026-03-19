import {createVar, style} from '@vanilla-extract/css'

export const fgColorVar = createVar()

export const githubRootSvg = style({
  fill: fgColorVar,
})

export const customImage = style({
  height: '19px',
  width: '19px',
  objectFit: 'contain',
})
