import {globalStyle, style} from '@vanilla-extract/css'
import {vars} from '@sanity/ui/css'

export const rootSpanStyle = style({
  display: 'inline-flex',
  alignItems: 'center',
  verticalAlign: 'top',
  height: 'calc(1em - 1px)',
  maxWidth: '100%',
})

export const mediaSpanStyle = style({
  position: 'relative',
  display: 'inline-block',
  width: 'calc(1em - 1px)',
  height: 'calc(1em - 1px)',
  minWidth: 'calc(1em - 1px)',
})

globalStyle(`${mediaSpanStyle} img`, {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  borderRadius: vars.radius[1],
})

globalStyle(`${mediaSpanStyle} img + span`, {
  position: 'absolute',
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
  boxShadow: `inset 0 0 0 1px ${vars.color.fg}`,
  opacity: 0.2,
  borderRadius: vars.radius[1],
})

globalStyle(`${mediaSpanStyle} svg`, {
  display: 'block',
  fontSize: 'calc(14 / 16 * 1em)',
  margin: '1px 0',
})

globalStyle(`${mediaSpanStyle} svg[data-sanity-icon]`, {
  fontSize: 'calc(18 / 16 * 1em)',
  margin: 'calc(1px + (2 / 18 * -1em)) 0',
})

const textSize = vars.font.text.scale[1]

export const textSpanStyle = style({
  fontSize: `calc(${textSize.fontSize} / 16 * 1em)`,
  fontWeight: vars.font.text.weight.medium,
  boxSizing: 'border-box',
  display: 'inline-block',
  verticalAlign: 'top',
  lineHeight: textSize.lineHeight,
  paddingLeft: '0.5em',
  paddingRight: 'calc(0.5em - 2px)',
  minWidth: 0,
})

globalStyle(`${textSpanStyle} > span`, {
  display: 'block',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  overflow: 'clip',
})
