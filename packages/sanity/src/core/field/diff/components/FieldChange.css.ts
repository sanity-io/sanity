import {css} from '#styled-system/css'

/** `color.solid.critical.enabled.bg` (v2: `color.button.default.critical.enabled.bg`) */
export const fieldChangeErrorVar = '--field-change-error'
/** `rem(space[1])` */
export const diffInspectPaddingXSmallVar = '--field-change-diff-inspect-padding-x-small'
/** `rem(space[2])` */
export const diffInspectPaddingSmallVar = '--field-change-diff-inspect-padding-small'

export const fieldChangeContainer = css({
  '&[data-revert-all-changes-hover] [data-revert-all-hover]::before': {
    borderLeft: `2px solid var(${fieldChangeErrorVar})`,
  },
})

export const diffBorder = css({
  'position': 'relative',
  'padding': `var(${diffInspectPaddingXSmallVar}) 0 var(${diffInspectPaddingXSmallVar}) var(${diffInspectPaddingSmallVar})`,
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
    borderLeft: `2px solid var(${fieldChangeErrorVar})`,
  },
})
