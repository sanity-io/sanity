import {css} from '#styled-system/css'

export const changeListWrapper = css({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
})

/** `color.solid.critical.enabled.bg` (v2: `color.button.default.critical.enabled.bg`) */
export const fieldChangeErrorVar = '--group-change-field-change-error'
/** `rem(space[1])` */
export const diffInspectPaddingXSmallVar = '--group-change-diff-inspect-padding-x-small'
/** `rem(space[2])` */
export const diffInspectPaddingSmallVar = '--group-change-diff-inspect-padding-small'

export const groupChangeContainer = css({
  'position': 'relative',
  'padding': `var(${diffInspectPaddingXSmallVar}) var(${diffInspectPaddingSmallVar})`,
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
      borderLeft: `2px solid var(${fieldChangeErrorVar})`,
    },
})
