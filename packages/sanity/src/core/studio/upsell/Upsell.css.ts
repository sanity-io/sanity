import {globalStyle, style} from '@vanilla-extract/css'
import {white} from '@sanity/color'
import {getVarName, vars} from '@sanity/ui/css'

// UpsellPanel styles
export const panelDescriptionRootStyle = style({
  margin: 'auto 0',
})

// UpsellDialog styles
export const dialogStyledButtonStyle = style({
  position: 'absolute',
  top: vars.space[3],
  right: vars.space[3],
  zIndex: 20,
  background: 'transparent',
  borderRadius: '9999px',
  boxShadow: 'none',
  color: white.hex,
  [getVarName(vars.color.fg)]: white.hex,
  selectors: {
    '&:hover': {
      [getVarName(vars.color.fg)]: white.hex,
    },
  },
})

export const dialogImageStyle = style({
  objectFit: 'cover',
  width: '100%',
  height: '100%',
  maxHeight: '200px',
})

// UpsellDescriptionSerializer styles
export const dividerStyle = style({
  height: '1px',
  background: vars.color.border,
  width: '100%',
})

export const serializerContainerStyle = style({})

globalStyle(`${serializerContainerStyle} > div:first-child`, {
  marginTop: 0,
})

globalStyle(`${serializerContainerStyle} > [data-ui='Box']:last-child`, {
  marginBottom: 0,
})

export const iconTextContainerAccentStyle = style({
  [getVarName(vars.color.muted.fg)]: 'var(--card-accent-fg-color)',
})

export const accentSpanStyle = style({
  color: 'var(--card-accent-fg-color)',
  [getVarName(vars.color.muted.fg)]: 'var(--card-accent-fg-color)',
})

export const semiboldSpanStyle = style({
  fontWeight: vars.font.text.weight.semibold,
})

export const linkStyle = style({
  fontWeight: 600,
})

export const linkUseTextColorStyle = style({
  color: 'var(--card-muted-fg-color) !important',
})

export const dynamicIconContainerStyle = style({
  fontSize: 'calc(21 / 16 * 1rem) !important',
  minWidth: 'calc(21 / 16 * 1rem - 0.375rem)',
  lineHeight: 0,
})

globalStyle(`${dynamicIconContainerStyle} > svg`, {
  height: '1em',
  width: '1em',
  display: 'inline',
  fontSize: '1em !important',
  margin: '-0.375rem !important',
})

globalStyle(`${dynamicIconContainerStyle} > svg *[stroke]`, {
  stroke: 'currentColor',
})

export const imageBlockStyle = style({
  objectFit: 'cover',
  width: '100%',
  borderRadius: vars.radius[3],
})
