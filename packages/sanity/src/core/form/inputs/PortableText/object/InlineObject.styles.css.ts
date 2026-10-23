import {css} from '#styled-system/css'

export const radius2Var = '--inline-object-radius-2'
/** `color.selectable.primary.selected.border` */
export const focusedBorderColorVar = '--inline-object-focused-border-color'
/** `color.selectable.primary.pressed.fg` */
export const focusedFgColorVar = '--inline-object-focused-fg-color'
/** `color.selectable.primary.pressed.bg` */
export const selectedBgColorVar = '--inline-object-selected-bg-color'
/** `color.input.default.hovered.border` */
export const hoveredBorderColorVar = '--inline-object-hovered-border-color'
/** `color._dark ? hues.purple[950].hex : hues.purple[50].hex` */
export const markersBgColorVar = '--inline-object-markers-bg-color'
/** `color.button.ghost.caution.hovered.bg` (the legacy theme's `color.muted.caution.hovered.bg`) */
export const warningBgColorVar = '--inline-object-warning-bg-color'
/** `color.button.ghost.caution.hovered.border` (the legacy theme's `color.muted.caution.hovered.border`) */
export const warningBorderColorVar = '--inline-object-warning-border-color'
/** `color.input.invalid.enabled.bg` */
export const invalidBgColorVar = '--inline-object-invalid-bg-color'
/** `color.input.invalid.enabled.border` */
export const invalidBorderColorVar = '--inline-object-invalid-border-color'
/** `color.input.invalid.hovered.border` */
export const invalidHoveredBorderColorVar = '--inline-object-invalid-hovered-border-color'

export const root = css({
  'lineHeight': 0,
  'height': 'calc(1em - 1px)',
  'cursor': 'default',
  // Card sets `padding: 0`, `border-radius`, and `box-shadow` on itself
  '&&': {
    padding: '2px',
    borderRadius: `var(${radius2Var})`,
    boxShadow: 'inset 0 0 0 1px var(--card-border-color)',
  },
  // Card sets `display: block` on itself through `&:not([hidden])`
  '&&:not([hidden])': {
    display: 'inline-flex',
    alignItems: 'center',
    verticalAlign: 'text-bottom',
    marginInline: '2px',
  },
  '&[data-read-only]': {
    cursor: 'default',
  },
  '&[data-focused]': {
    boxShadow: `inset 0 0 0 1px var(${focusedBorderColorVar})`,
    color: `var(${focusedFgColorVar})`,
  },
  '&[data-selected]': {
    backgroundColor: `var(${selectedBgColorVar})`,
  },
  // Being invalid wins over a warning, and both over the custom markers; `:where()` keeps the
  // specificity of each rule as it was
  '&[data-markers]:where(:not([data-warning], [data-invalid]))': {
    '--card-bg-color': `var(${markersBgColorVar})`,
  },
  '&[data-warning]:where(:not([data-invalid]))': {
    '--card-bg-color': `var(${warningBgColorVar})`,
  },
  '&[data-invalid]': {
    '--card-bg-color': `var(${invalidBgColorVar})`,
    '--card-border-color': `var(${invalidBorderColorVar})`,
  },
  '@media (hover: hover)': {
    '&:not([data-focused]):not([data-selected]):hover': {
      '--card-border-color': `var(${hoveredBorderColorVar})`,
    },
    '&[data-warning]:where(:not([data-invalid])):hover': {
      '--card-border-color': `var(${warningBorderColorVar})`,
    },
    '&[data-invalid]:hover': {
      '--card-border-color': `var(${invalidHoveredBorderColorVar})`,
    },
  },
})

export const previewSpan = css({
  display: 'block',
  maxWidth: 'calc(5em + 80px)',
  position: 'relative',
})

export const tooltipBox = css({
  maxWidth: '250px',
})
