import {css} from '#styled-system/css'

export const root = css({
  '& .sidebarPanes .Pane': {
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  '& .Resizer': {
    background: 'var(--card-border-color)',
    opacity: 1,
    zIndex: 1,
    boxSizing: 'border-box',
    backgroundClip: 'padding-box',
    border: 'solid transparent',
  },
  '& .Resizer:hover': {
    borderColor: 'var(--card-shadow-ambient-color)',
  },
  '& .Resizer.horizontal': {
    height: '11px',
    margin: '-5px 0',
    borderWidth: '5px 0',
    cursor: 'row-resize',
    width: '100%',
    zIndex: 4,
  },
  '& .Resizer.vertical': {
    width: '11px',
    margin: '0 -5px',
    borderWidth: '0 5px',
    cursor: 'col-resize',
    zIndex: 2 /* To prevent the resizer from being hidden behind CodeMirror scroll area */,
  },
  '& .Resizer.disabled': {
    cursor: 'not-allowed',
  },
  '& .Resizer.disabled:hover': {
    borderColor: 'transparent',
  },
})

export const queryRecallPaneContainer = css({
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
})

export const queryRecallPaneWrapper = css({
  minHeight: 0,
})

export const header = css({
  'position': 'relative',
  'flexShrink': 0,
  'zIndex': 6,
  'overflow': 'visible',
  'borderBottom': '1px solid var(--card-border-color)',

  // Override the background-color @sanity/ui's Card sets on itself
  '&&': {
    background: 'var(--card-bg-color)',
  },
})

// The label's own class is atomic, so the rule `inputBackgroundContainer` has for the labels
// inside it refers to this fixed marker class, attached next to the atomic one.
const styledLabelMarker = 'vision-styledLabel'

export const styledLabel = `${styledLabelMarker} ${css({
  flex: 1,
})}`

export const splitpaneContainer = css({
  position: 'relative',
  minHeight: 0,
  zIndex: 1,
})

export const queryCopyLink = css({
  cursor: 'pointer',
  marginRight: 'auto',
})

export const inputBackgroundContainer = css({
  position: 'absolute',
  top: '1rem',
  left: 0,
  padding: 0,
  margin: 0,
  zIndex: 10,
  right: 0,
  [`& .${styledLabelMarker}`]: {
    userSelect: 'none',
  },
})

export const inputBackgroundContainerLeft = css({
  // This is so its aligned with the gutters of CodeMirror
  left: '33px',
})

export const inputContainer = css({
  width: '100%',
  height: '100%',
  position: 'relative',
  flexDirection: 'column',
})

export const resultOuterContainer = css({
  height: '100%',
})

export const resultInnerContainer = css({
  position: 'relative',
})

export const resultContainer = css({
  height: '100%',
  width: '100%',
  position: 'absolute',
  maxWidth: '100%',
})

export const resultContainerInvalid = css({
  '&&::after': {
    backgroundColor: 'var(--card-bg-color)',
    content: '""',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: '100%',
  },
})

export const result = css({
  position: 'relative',
  width: '100%',
  height: '100%',
  zIndex: 20,
})

export const resultFooter = css({
  borderTop: '1px solid var(--card-border-color)',
  flexWrap: 'wrap',
})

export const timingsCard = css({
  position: 'relative',
})

/** Set inline by `TimingsTextContainer` from the theme */
export const timingsTextMinHeightVar = '--vision-timings-text-min-height'

export const timingsTextContainer = css({
  height: '100%',
  minHeight: `var(${timingsTextMinHeightVar})`,
})

export const downloadsCard = css({
  position: 'relative',
})

/** Set inline by `SaveResultLabel` from the theme */
export const saveResultSpanGapVar = '--vision-save-result-span-gap'

export const saveResultLabel = css({
  // Override the transform/pseudo-elements @sanity/ui's Text applies for baseline trimming
  '&&': {
    transform: 'initial',
  },
  '&&::before': {
    content: 'none',
  },
  '&&::after': {
    content: 'none',
  },
  '& > span': {
    display: 'flex !important',
    flexWrap: 'wrap',
    gap: `var(${saveResultSpanGapVar})`,
    alignItems: 'center',
  },
})

export const controlsContainer = css({
  borderTop: '1px solid var(--card-border-color)',
})
