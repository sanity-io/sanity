import {createVar, globalStyle, style} from '@vanilla-extract/css'

/** `radius[3]`, set on the serializer root by `UpsellDescriptionSerializer`. */
export const radius3Var = createVar()
/** `font.text.weights.semibold`, set on the serializer root by `UpsellDescriptionSerializer`. */
export const textSemiboldWeightVar = createVar()

export const divider = style({
  height: '1px',
  background: 'var(--card-border-color)',
  width: '100%',
})

export const serializerContainer = style({})

/* Remove margin top of first element */
globalStyle(`${serializerContainer} > div:first-child`, {
  marginTop: 0,
})

/* Remove margin bottom to last box. */
globalStyle(`${serializerContainer} > [data-ui='Box']:last-child`, {
  marginBottom: 0,
})

export const accentSpan = style({
  color: 'var(--card-accent-fg-color)',
  vars: {'--card-icon-color': 'var(--card-accent-fg-color)'},
})

export const semiboldSpan = style({
  fontWeight: textSemiboldWeightVar,
})

/** Forces the icon to leave the necessary space to the right or left it has surrounding text. */
export const inlineIconTextLeft = style({
  selectors: {
    '&&[data-sanity-icon]': {
      marginLeft: 0,
    },
  },
})

export const inlineIconTextRight = style({
  selectors: {
    '&&[data-sanity-icon]': {
      marginRight: 0,
    },
  },
})

export const link = style({
  fontWeight: 600,
})

export const linkTextColor = style({
  color: 'var(--card-muted-fg-color) !important',
})

export const dynamicIconContainer = style({
  display: 'inline',
  fontSize: 'calc(21 / 16 * 1rem) !important',
  minWidth: 'calc(21 / 16 * 1rem - 0.375rem)',
  lineHeight: 0,
})

export const dynamicIconContainerInline = style({
  display: 'inline-block',
})

globalStyle(`${dynamicIconContainer} > svg`, {
  height: '1em',
  width: '1em',
  display: 'inline',
  fontSize: '1em !important',
  margin: '-0.375rem !important',
})

globalStyle(`${dynamicIconContainer} > svg *[stroke]`, {
  stroke: 'currentColor',
})

export const image = style({
  objectFit: 'cover',
  width: '100%',
  borderRadius: radius3Var,
})
