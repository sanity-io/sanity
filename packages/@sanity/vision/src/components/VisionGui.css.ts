import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const root = style({})

globalStyle(`${root} .sidebarPanes .Pane`, {
  overflowY: 'auto',
  overflowX: 'hidden',
})

export const queryRecallPaneContainer = style({
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
})

export const queryRecallPaneWrapper = style({
  minHeight: 0,
})

globalStyle(`${root} .Resizer`, {
  background: 'var(--card-border-color)',
  opacity: 1,
  zIndex: 1,
  boxSizing: 'border-box',
  backgroundClip: 'padding-box',
  border: 'solid transparent',
})

globalStyle(`${root} .Resizer:hover`, {
  borderColor: 'var(--card-shadow-ambient-color)',
})

globalStyle(`${root} .Resizer.horizontal`, {
  height: '11px',
  margin: '-5px 0',
  borderWidth: '5px 0',
  cursor: 'row-resize',
  width: '100%',
  zIndex: 4,
})

globalStyle(`${root} .Resizer.vertical`, {
  width: '11px',
  margin: '0 -5px',
  borderWidth: '0 5px',
  cursor: 'col-resize',
  zIndex: 2 /* To prevent the resizer from being hidden behind CodeMirror scroll area */,
})

globalStyle(`${root} .Resizer.disabled`, {
  cursor: 'not-allowed',
})

globalStyle(`${root} .Resizer.disabled:hover`, {
  borderColor: 'transparent',
})

export const header = style({
  position: 'relative',
  flexShrink: 0,
  zIndex: 6,
  overflow: 'visible',
  borderBottom: '1px solid var(--card-border-color)',
  selectors: {
    // Override the background-color @sanity/ui's Card sets on itself
    '&&': {
      background: 'var(--card-bg-color)',
    },
  },
})

export const styledLabel = style({
  flex: 1,
})

export const splitpaneContainer = style({
  position: 'relative',
  minHeight: 0,
  zIndex: 1,
})

export const queryCopyLink = style({
  cursor: 'pointer',
  marginRight: 'auto',
})

export const inputBackgroundContainer = style({
  position: 'absolute',
  top: '1rem',
  left: 0,
  padding: 0,
  margin: 0,
  zIndex: 10,
  right: 0,
})

globalStyle(`${inputBackgroundContainer} ${styledLabel}`, {
  userSelect: 'none',
})

export const inputBackgroundContainerLeft = style({
  // This is so its aligned with the gutters of CodeMirror
  left: '33px',
})

export const inputContainer = style({
  width: '100%',
  height: '100%',
  position: 'relative',
  flexDirection: 'column',
})

export const resultOuterContainer = style({
  height: '100%',
})

export const resultInnerContainer = style({
  position: 'relative',
})

export const resultContainer = style({
  height: '100%',
  width: '100%',
  position: 'absolute',
  maxWidth: '100%',
})

export const resultContainerInvalid = style({
  selectors: {
    '&&::after': {
      backgroundColor: 'var(--card-bg-color)',
      content: '""',
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      width: '100%',
    },
  },
})

export const result = style({
  position: 'relative',
  width: '100%',
  height: '100%',
  zIndex: 20,
})

export const resultFooter = style({
  borderTop: '1px solid var(--card-border-color)',
  flexWrap: 'wrap',
})

export const timingsCard = style({
  position: 'relative',
})

export const timingsTextMinHeightVar = createVar()

export const timingsTextContainer = style({
  height: '100%',
  minHeight: timingsTextMinHeightVar,
})

export const downloadsCard = style({
  position: 'relative',
})

export const saveResultSpanGapVar = createVar()

export const saveResultLabel = style({
  selectors: {
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
  },
})

globalStyle(`${saveResultLabel} > span`, {
  display: 'flex !important',
  flexWrap: 'wrap',
  gap: saveResultSpanGapVar,
  alignItems: 'center',
})

export const controlsContainer = style({
  borderTop: '1px solid var(--card-border-color)',
})
