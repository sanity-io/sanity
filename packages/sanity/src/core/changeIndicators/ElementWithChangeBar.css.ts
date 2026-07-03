import {style} from '@vanilla-extract/css'

export const changeBarWrapper = style({
  'vars': {
    '--change-bar-offset': '4px',
  },
  'display': 'flex',
  'position': 'relative',
  '@media': {
    '(hover: hover)': {
      selectors: {
        '&:hover': {
          zIndex: 10,
        },
      },
    },
  },
})

export const changeBarWrapperDisabled = style({})
export const changeBarWrapperFocused = style({})
export const changeBarWrapperNotChanged = style({})
export const changeBarWrapperReviewOpen = style({})

export const changeBarMarker = style({
  'position': 'absolute',
  'top': '-1px',
  'left': 'var(--change-bar-offset)',
  'width': '1px',
  'bottom': '-1px',
  'backgroundColor': 'var(--card-bg-color)',
  'selectors': {
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
    [`${changeBarWrapper} &::after`]: {
      opacity: 0.5,
    },
    [`${changeBarWrapperFocused} &::after`]: {
      opacity: 1,
    },
    /* hide when field is not changed */
    [`${changeBarWrapperNotChanged} &::after`]: {
      opacity: 0,
      pointerEvents: 'none',
    },
    [`${changeBarWrapperDisabled} &::after`]: {
      display: 'none',
    },
  },
  '@media': {
    '(hover: hover)': {
      selectors: {
        [`${changeBarWrapper}:hover &::after`]: {
          opacity: 1,
        },
      },
    },
  },
})

export const changeBarButton = style({
  appearance: 'none',
  border: 0,
  outline: 0,
  display: 'block',
  padding: 0,
  background: 'transparent',
  opacity: 0,
  position: 'absolute',
  height: '100%',
  left: 'calc(-0.25rem + var(--change-bar-offset))',
  width: 'calc(1rem - 1px)',
  transition: 'opacity 250ms',
  selectors: {
    '&:focus': {
      border: 0,
      outline: 0,
    },
    /* hide the change bar button when review changes is open */
    [`${changeBarWrapperReviewOpen} &`]: {
      opacity: 0,
    },
  },
})

export const changeBarButtonInteractive = style({
  cursor: 'pointer',
  pointerEvents: 'all',
})

export const changeBarButtonWithHoverEffect = style({
  '@media': {
    '(hover: hover)': {
      selectors: {
        '&:hover': {
          opacity: 0.2,
        },
      },
    },
  },
})

export const fieldWrapper = style({
  flexGrow: 1,
  minWidth: 0,
})

export const changeBar = style({
  position: 'relative',
  opacity: 1,
  transition: 'opacity 100ms',
})
