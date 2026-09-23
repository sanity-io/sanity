import {createVar, globalStyle, style} from '@vanilla-extract/css'

/** `color.solid.critical.enabled.bg` (v2: `color.button.default.critical.enabled.bg`) */
export const fieldChangeErrorVar = createVar()
/** `rem(space[1])` */
export const diffInspectPaddingXSmallVar = createVar()
/** `rem(space[2])` */
export const diffInspectPaddingSmallVar = createVar()

export const fieldChangeContainer = style({})

globalStyle(
  `${fieldChangeContainer}[data-revert-all-changes-hover] [data-revert-all-hover]::before`,
  {
    borderLeft: `2px solid ${fieldChangeErrorVar}`,
  },
)

export const diffBorder = style({
  position: 'relative',
  padding: `${diffInspectPaddingXSmallVar} 0 ${diffInspectPaddingXSmallVar} ${diffInspectPaddingSmallVar}`,
  selectors: {
    '&::before': {
      content: '""',
      display: 'block',
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      borderLeft: '1px solid var(--card-border-color)',
    },
    '&[data-error]:hover::before, &[data-revert-field-hover]:hover::before': {
      borderLeft: `2px solid ${fieldChangeErrorVar}`,
    },
  },
})
