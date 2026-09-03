import {createVar, style} from '@vanilla-extract/css'

export const radius2Var = createVar()
/** `color.selectable.primary.selected.border` */
export const focusedBorderColorVar = createVar()
/** `color.selectable.primary.pressed.fg` */
export const focusedFgColorVar = createVar()
/** `color.selectable.primary.pressed.bg` */
export const selectedBgColorVar = createVar()
/** `color.input.default.hovered.border` */
export const hoveredBorderColorVar = createVar()
/** `color._dark ? hues.purple[950].hex : hues.purple[50].hex` */
export const markersBgColorVar = createVar()
/** `color.button.ghost.caution.hovered.bg` (the legacy theme's `color.muted.caution.hovered.bg`) */
export const warningBgColorVar = createVar()
/** `color.button.ghost.caution.hovered.border` (the legacy theme's `color.muted.caution.hovered.border`) */
export const warningBorderColorVar = createVar()
/** `color.input.invalid.enabled.bg` */
export const invalidBgColorVar = createVar()
/** `color.input.invalid.enabled.border` */
export const invalidBorderColorVar = createVar()
/** `color.input.invalid.hovered.border` */
export const invalidHoveredBorderColorVar = createVar()

export const root = style({
  'lineHeight': 0,
  'boxShadow': 'inset 0 0 0 1px var(--card-border-color)',
  'height': 'calc(1em - 1px)',
  'cursor': 'default',
  'selectors': {
    // Card sets `padding: 0` and `border-radius` on itself
    '&&': {
      padding: '2px',
      borderRadius: radius2Var,
    },
    // Card sets `display: block` on itself through `&:not([hidden])`
    '&&:not([hidden])': {
      display: 'inline-flex',
      alignItems: 'center',
      verticalAlign: 'text-bottom',
      marginInline: '2px',
    },
    '&[data-ready-only]': {
      cursor: 'default',
    },
    '&[data-focused]': {
      boxShadow: `inset 0 0 0 1px ${focusedBorderColorVar}`,
      color: focusedFgColorVar,
    },
    '&[data-selected]': {
      backgroundColor: selectedBgColorVar,
    },
    '&[data-markers]': {
      vars: {
        '--card-bg-color': markersBgColorVar,
      },
    },
    '&[data-warning]': {
      vars: {
        '--card-bg-color': warningBgColorVar,
      },
    },
    '&[data-invalid]': {
      vars: {
        '--card-bg-color': invalidBgColorVar,
        '--card-border-color': invalidBorderColorVar,
      },
    },
  },
  '@media': {
    '(hover: hover)': {
      selectors: {
        '&:not([data-focused]):not([data-selected]):hover': {
          vars: {
            '--card-border-color': hoveredBorderColorVar,
          },
        },
        '&[data-warning]:hover': {
          vars: {
            '--card-border-color': warningBorderColorVar,
          },
        },
        '&[data-invalid]:hover': {
          vars: {
            '--card-border-color': invalidHoveredBorderColorVar,
          },
        },
      },
    },
  },
})

export const previewSpan = style({
  display: 'block',
  maxWidth: 'calc(5em + 80px)',
  position: 'relative',
})

export const tooltipBox = style({
  maxWidth: '250px',
})
