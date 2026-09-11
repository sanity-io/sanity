import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const mediaWidthVar = createVar()
export const mediaHeightVar = createVar()
export const mediaRadiusVar = createVar()
export const mediaIconSizeVar = createVar()

export const mediaWrapper = style({
  position: 'relative',
  borderRadius: mediaRadiusVar,
  display: 'flex',
  overflow: ['hidden', 'clip'],
  alignItems: 'center',
  justifyContent: 'center',
})

export const mediaWrapperResponsive = style({
  width: '100%',
  height: '100%',
})

export const mediaWrapperFixed = style({
  width: mediaWidthVar,
  height: mediaHeightVar,
  minWidth: mediaWidthVar,
})

globalStyle(`${mediaWrapper} img`, {
  position: 'absolute',
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  borderRadius: 'inherit',
})

// Shared styles for SVG icons
globalStyle(`${mediaWrapper} svg`, {
  color: 'var(--card-icon-color)',
  display: 'block',
  flex: 1,
})

// Specific styles for non Sanity icons
globalStyle(`${mediaWrapper} svg:not([data-sanity-icon])`, {
  height: '1em',
  width: '1em',
  maxWidth: '1em',
  maxHeight: '1em',
})

// Specific styles for Sanity icons
globalStyle(`${mediaWrapper} svg[data-sanity-icon]`, {
  display: 'block',
  fontSize: `calc(${mediaIconSizeVar} / 16 * 1em)`,
})

globalStyle(`${mediaWrapper} > span[data-border]`, {
  display: 'block',
  position: 'absolute',
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
  boxShadow: 'inset 0 0 0 1px var(--card-fg-color)',
  opacity: 0.1,
  borderRadius: 'inherit',
  pointerEvents: 'none',
})
