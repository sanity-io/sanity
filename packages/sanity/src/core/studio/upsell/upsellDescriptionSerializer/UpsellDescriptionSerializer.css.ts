import {css} from '#styled-system/css'

/** `radius[3]`, set on the serializer root by `UpsellDescriptionSerializer`. */
export const radius3Var = '--upsell-description-serializer-radius-3'
/** `font.text.weights.semibold`, set on the serializer root by `UpsellDescriptionSerializer`. */
export const textSemiboldWeightVar = '--upsell-description-serializer-text-semibold-weight'

export const divider = css({
  height: '1px',
  background: 'var(--card-border-color)',
  width: '100%',
})

export const serializerContainer = css({
  /* Remove margin top of first element */
  '& > div:first-child': {
    marginTop: 0,
  },
  /* Remove margin bottom to last box. */
  "& > [data-ui='Box']:last-child": {
    marginBottom: 0,
  },
})

export const accentSpan = css({
  'color': 'var(--card-accent-fg-color)',
  '--card-icon-color': 'var(--card-accent-fg-color)',
})

export const semiboldSpan = css({
  fontWeight: `var(${textSemiboldWeightVar})`,
})

/**
 * Forces the icon to leave the necessary space to the right or left it has surrounding text.
 * Text's own `& [data-sanity-icon]` rule sets `margin` at (0,2,0); `&&[data-sanity-icon]` (0,3,0)
 * outranks it regardless of sheet order.
 */
export const inlineIconTextLeft = css({
  '&&[data-sanity-icon]': {
    marginLeft: 0,
  },
})

export const inlineIconTextRight = css({
  '&&[data-sanity-icon]': {
    marginRight: 0,
  },
})

export const link = css({
  fontWeight: 600,
})

/** `&&` (0,2,0) outranks the (0,1,1) `& a` color of a @sanity/ui v4 `Heading` around the link */
export const linkTextColor = css({
  '&&': {
    color: 'var(--card-muted-fg-color)',
  },
})

export const dynamicIconContainer = css({
  'display': 'inline',
  'fontSize': 'calc(21 / 16 * 1rem)',
  'minWidth': 'calc(21 / 16 * 1rem - 0.375rem)',
  'lineHeight': 0,
  '& > svg': {
    height: '1em',
    width: '1em',
    display: 'inline',
  },
  // `&&&` (0,3,1) outranks the (0,2,1) `& svg:not([data-sanity-icon])` and (0,2,0)
  // `& [data-sanity-icon]` icon sizing of a @sanity/ui v4 `Heading` around the icon
  '&&& > svg': {
    fontSize: '1em',
    margin: '-0.375rem',
  },
  '& > svg *[stroke]': {
    stroke: 'currentColor',
  },
})

/** Follows `dynamicIconContainer` on the same element; `&&` keeps its `display` winning. */
export const dynamicIconContainerInline = css({
  '&&': {
    display: 'inline-block',
  },
})

export const image = css({
  objectFit: 'cover',
  width: '100%',
  borderRadius: `var(${radius3Var})`,
})
