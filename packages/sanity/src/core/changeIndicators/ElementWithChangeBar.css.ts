import {createVar, style} from '@vanilla-extract/css'

export const changeBarZIndexVar = createVar()
export const changeBarMarkerMinWidthVar = createVar()

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
  'top': -1,
  'left': 'var(--change-bar-offset)',
  'width': 1,
  'bottom': -1,
  'backgroundColor': 'var(--card-bg-color)',
  'selectors': {
    '&::after': {
      content: '',
      display: 'block',
      position: 'absolute',
      top: 1,
      left: 0,
      width: 1,
      bottom: 1,
      backgroundColor: 'var(--card-badge-caution-dot-color)',
      borderRadius: '0.5px',
    },
    [`${changeBarWrapper} &::after`]: {
      opacity: 0.5,
    },
    [`${changeBarWrapperDisabled} &::after`]: {
      display: 'none',
    },
    [`${changeBarWrapperFocused} &::after`]: {
      opacity: 1,
    },
    [`${changeBarWrapperNotChanged} &::after`]: {
      opacity: 0,
      pointerEvents: 'none',
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
    [`${changeBarWrapperReviewOpen} &`]: {
      opacity: 0,
    },
  },
})

export const changeBarButtonInteractive = style({
  cursor: 'pointer',
  pointerEvents: 'all',
})

export const changeBarButtonHoverEffect = style({
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
  zIndex: changeBarZIndexVar,
})
