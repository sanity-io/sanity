import {css} from '#styled-system/css'

export const targetBadge = css({
  'alignItems': 'center',
  // `&&`: Card sets `flex` and `box-shadow` through its own props.
  '&&': {
    flex: 'none',
    // Drawn as an inset shadow instead of the Card border prop so the 1px border
    // does not make the badge taller than the box-shadow-bordered VersionChip pills.
    boxShadow: 'inset 0 0 0 1px var(--card-border-color)',
  },
  // `&&&`: Card (Box) sets `display` through `&:not([hidden]) {display: block}` (0,2,0).
  '&&&': {
    display: 'inline-flex',
  },
})

export const badgeContainer = css({
  userSelect: 'none',
  flex: 'none',
})

export const badgeMotionWrapper = css({
  flex: 'none',
})
