import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const widthVar = createVar()
export const heightVar = createVar()
export const minWidthVar = createVar()
export const radiusVar = createVar()
export const iconSizeVar = createVar()

export const mediaWrapper = style({
  position: 'relative',
  width: widthVar,
  height: heightVar,
  minWidth: minWidthVar,
  borderRadius: radiusVar,
  display: 'flex',
  overflow: 'hidden',
  alignItems: 'center',
  justifyContent: 'center',
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

globalStyle(`${mediaWrapper} svg`, {
  color: 'var(--card-icon-color)',
  display: 'block',
  flex: 1,
})

globalStyle(`${mediaWrapper} svg:not([data-sanity-icon])`, {
  height: '1em',
  width: '1em',
  maxWidth: '1em',
  maxHeight: '1em',
})

globalStyle(`${mediaWrapper} svg[data-sanity-icon]`, {
  display: 'block',
  fontSize: iconSizeVar,
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
