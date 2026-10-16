import {css} from '#styled-system/css'

// The wrapper's own classes are atomic (one per declaration), so the rules of the marker and the
// button below that depend on the wrapper's state refer to it through these fixed marker classes,
// which `ChangeBarWrapper` attaches next to the atomic ones.
const changeBarWrapperMarker = 'sanity-changeBarWrapper'
export const changeBarWrapperDisabled = 'sanity-changeBarWrapperDisabled'
export const changeBarWrapperFocused = 'sanity-changeBarWrapperFocused'
export const changeBarWrapperNotChanged = 'sanity-changeBarWrapperNotChanged'
export const changeBarWrapperReviewOpen = 'sanity-changeBarWrapperReviewOpen'

export const changeBarWrapper = `${changeBarWrapperMarker} ${css({
  '--change-bar-offset': '4px',
  'display': 'flex',
  'position': 'relative',
  '@media (hover: hover)': {
    '&:hover': {
      zIndex: 10,
    },
  },
})}`

export const changeBarMarker = css({
  'position': 'absolute',
  'top': '-1px',
  'left': 'var(--change-bar-offset)',
  'width': '1px',
  'bottom': '-1px',
  'backgroundColor': 'var(--card-bg-color)',
  '&::after': {
    content: '""',
    display: 'block',
    position: 'absolute',
    top: '1px',
    left: 0,
    width: '1px',
    bottom: '1px',
    backgroundColor: 'var(--card-badge-caution-dot-color)',
    borderRadius: '0.5px',
  },
  [`.${changeBarWrapperMarker} &`]: {
    '&::after': {
      opacity: 0.5,
    },
  },
  [`.${changeBarWrapperFocused} &`]: {
    '&::after': {
      opacity: 1,
    },
  },
  /* hide when field is not changed */
  [`.${changeBarWrapperNotChanged} &`]: {
    '&::after': {
      opacity: 0,
      pointerEvents: 'none',
    },
  },
  [`.${changeBarWrapperDisabled} &`]: {
    '&::after': {
      display: 'none',
    },
  },
  '@media (hover: hover)': {
    [`.${changeBarWrapperMarker}:hover &`]: {
      '&::after': {
        opacity: 1,
      },
    },
  },
})

export const changeBarButton = css({
  'appearance': 'none',
  'border': 0,
  'outline': 0,
  'display': 'block',
  'padding': 0,
  'background': 'transparent',
  'opacity': 0,
  'position': 'absolute',
  'height': '100%',
  'left': 'calc(-0.25rem + var(--change-bar-offset))',
  'width': 'calc(1rem - 1px)',
  'transition': 'opacity 250ms',
  '&:focus': {
    border: 0,
    outline: 0,
  },
  /* hide the change bar button when review changes is open */
  [`.${changeBarWrapperReviewOpen} &`]: {
    opacity: 0,
  },
})

export const changeBarButtonInteractive = css({
  cursor: 'pointer',
  pointerEvents: 'all',
})

export const changeBarButtonWithHoverEffect = css({
  '@media (hover: hover)': {
    '&:hover': {
      opacity: 0.2,
    },
  },
})

export const fieldWrapper = css({
  flexGrow: 1,
  minWidth: 0,
})

export const changeBar = css({
  position: 'relative',
  opacity: 1,
  transition: 'opacity 100ms',
})
