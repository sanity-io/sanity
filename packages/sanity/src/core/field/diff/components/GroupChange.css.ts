import {createVar, style} from '@vanilla-extract/css'

export const changeListWrapper = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
})

/** `color.solid.critical.enabled.bg` (v2: `color.button.default.critical.enabled.bg`) */
export const fieldChangeErrorVar = createVar()
/** `rem(space[1])` */
export const diffInspectPaddingXSmallVar = createVar()
/** `rem(space[2])` */
export const diffInspectPaddingSmallVar = createVar()

export const groupChangeContainer = style({
  position: 'relative',
  padding: `${diffInspectPaddingXSmallVar} ${diffInspectPaddingSmallVar}`,
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
    '&[data-error]:hover::before, &[data-revert-group-hover]:hover::before, &[data-revert-all-groups-hover]::before':
      {
        borderLeft: `2px solid ${fieldChangeErrorVar}`,
      },
  },
})
