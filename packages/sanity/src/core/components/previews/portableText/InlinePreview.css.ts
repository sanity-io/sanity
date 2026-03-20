import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const radiusVar = createVar()
export const fontSizeVar = createVar()
export const fontWeightVar = createVar()
export const lineHeightVar = createVar()

export const rootSpan = style({
  display: 'inline-flex',
  alignItems: 'center',
  verticalAlign: 'top',
  height: 'calc(1em - 1px)',
  maxWidth: '100%',
})

export const mediaSpan = style({
  position: 'relative',
  display: 'inline-block',
  width: 'calc(1em - 1px)',
  height: 'calc(1em - 1px)',
  minWidth: 'calc(1em - 1px)',
})

globalStyle(`${mediaSpan} img`, {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  borderRadius: radiusVar,
})

globalStyle(`${mediaSpan} img + span`, {
  position: 'absolute',
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
  boxShadow: 'inset 0 0 0 1px var(--card-fg-color)',
  opacity: 0.2,
  borderRadius: radiusVar,
})

globalStyle(`${mediaSpan} svg`, {
  display: 'block',
  fontSize: 'calc(14 / 16 * 1em)',
  margin: '1px 0',
})

globalStyle(`${mediaSpan} svg[data-sanity-icon]`, {
  fontSize: 'calc(18 / 16 * 1em)',
  margin: 'calc(1px + (2 / 18 * -1em)) 0',
})

export const textSpan = style({
  fontSize: fontSizeVar,
  fontWeight: fontWeightVar,
  boxSizing: 'border-box',
  display: 'inline-block',
  verticalAlign: 'top',
  lineHeight: lineHeightVar,
  paddingLeft: '0.5em',
  paddingRight: 'calc(0.5em - 2px)',
  minWidth: 0,
})

globalStyle(`${textSpan} > span`, {
  display: 'block',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
})
