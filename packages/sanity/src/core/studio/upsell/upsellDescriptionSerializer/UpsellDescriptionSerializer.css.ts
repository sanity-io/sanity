import {createVar, style, globalStyle} from '@vanilla-extract/css'

export const divider = style({
  height: '1px',
  background: 'var(--card-border-color)',
  width: '100%',
})

export const serializerContainer = style({})

globalStyle(`.${serializerContainer} > div:first-child`, {
  marginTop: 0,
})

globalStyle(`.${serializerContainer} > [data-ui='Box']:last-child`, {
  marginBottom: 0,
})

export const iconTextContainer = style({})

export const iconTextContainerAccent = style({
  vars: {
    '--card-icon-color': 'var(--card-accent-fg-color)',
  },
})

export const accentSpan = style({
  color: 'var(--card-accent-fg-color)',
  vars: {
    '--card-icon-color': 'var(--card-accent-fg-color)',
  },
})

export const fontWeightVar = createVar()

export const semiboldSpan = style({
  fontWeight: fontWeightVar,
})

export const inlineIcon = style({})

export const inlineIconWithTextLeft = style({
  selectors: {
    '&[data-sanity-icon]': {
      marginLeft: '0',
    },
  },
})

export const inlineIconWithTextRight = style({
  selectors: {
    '&[data-sanity-icon]': {
      marginRight: '0',
    },
  },
})

export const link = style({
  fontWeight: 600,
})

export const linkUseTextColor = style({
  fontWeight: 600,
  color: 'var(--card-muted-fg-color) !important' as any,
})

export const dynamicIconContainer = style({
  fontSize: 'calc(21 / 16 * 1rem) !important' as any,
  minWidth: 'calc(21 / 16 * 1rem - 0.375rem)',
  lineHeight: 0,
})

export const dynamicIconContainerInline = style({
  display: 'inline-block',
  fontSize: 'calc(21 / 16 * 1rem) !important' as any,
  minWidth: 'calc(21 / 16 * 1rem - 0.375rem)',
  lineHeight: 0,
})

export const dynamicIconContainerBlock = style({
  display: 'inline',
  fontSize: 'calc(21 / 16 * 1rem) !important' as any,
  minWidth: 'calc(21 / 16 * 1rem - 0.375rem)',
  lineHeight: 0,
})

globalStyle(
  `.${dynamicIconContainer} > svg, .${dynamicIconContainerInline} > svg, .${dynamicIconContainerBlock} > svg`,
  {
    height: '1em',
    width: '1em',
    display: 'inline',
    fontSize: '1em !important',
    margin: '-0.375rem !important',
  },
)

globalStyle(
  `.${dynamicIconContainer} > svg *[stroke], .${dynamicIconContainerInline} > svg *[stroke], .${dynamicIconContainerBlock} > svg *[stroke]`,
  {
    stroke: 'currentColor',
  },
)

export const imageRadiusVar = createVar()

export const imageBlock = style({
  objectFit: 'cover',
  width: '100%',
  borderRadius: imageRadiusVar,
})
