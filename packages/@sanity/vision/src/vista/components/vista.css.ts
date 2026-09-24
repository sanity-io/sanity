import {globalStyle, style} from '@vanilla-extract/css'

export const root = style({
  position: 'relative',
})

// Resizer styles for @rexxars/react-split-pane, mirroring the ones in ../../components/VisionGui.css.ts
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
  zIndex: 2,
})

globalStyle(`${root} .Resizer.disabled`, {
  cursor: 'default',
})

globalStyle(`${root} .Resizer.disabled:hover`, {
  borderColor: 'transparent',
})

globalStyle(`${root} .Pane`, {
  minWidth: 0,
  minHeight: 0,
})

/** Fills the pane it is rendered into; SplitPane positions panes absolutely */
export const paneFill = style({
  position: 'relative',
  width: '100%',
  height: '100%',
  minWidth: 0,
  minHeight: 0,
})

export const splitPaneContainer = style({
  position: 'relative',
  minHeight: 0,
  minWidth: 0,
  flex: '1 1 0%',
})

/** Editor label floating above CodeMirror's gutter, aligned with its line numbers */
export const editorLabel = style({
  position: 'absolute',
  top: '1rem',
  left: '33px',
  right: 0,
  zIndex: 10,
  pointerEvents: 'none',
  userSelect: 'none',
})

export const editorContainer = style({
  position: 'relative',
  height: '100%',
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
})

export const scrollArea = style({
  minHeight: 0,
  overflow: 'auto',
})

export const sidebarRail = style({
  flexShrink: 0,
  transition: 'width 120ms ease-out',
})

export const sidebarRailCollapsed = style({
  width: '49px',
})

export const sidebarRailExpanded = style({
  width: '224px',
})

export const sidebarDrawer = style({
  width: '300px',
  flexShrink: 0,
  minHeight: 0,
})

export const tabBar = style({
  overflowX: 'auto',
  overflowY: 'hidden',
  scrollbarWidth: 'thin',
  flexShrink: 0,
})

export const tab = style({
  position: 'relative',
  flexShrink: 0,
  maxWidth: '240px',
  borderBottom: '2px solid transparent',
  selectors: {
    '&[aria-selected="true"]': {
      borderBottomColor: 'var(--card-fg-color)',
    },
  },
})

export const tabTitleButton = style({
  minWidth: 0,
  flexShrink: 1,
  overflow: 'hidden',
})

export const tabCloseButton = style({
  flexShrink: 0,
  opacity: 0,
  transition: 'opacity 100ms',
  selectors: {
    [`${tab}:hover &, ${tab}:focus-within &, ${tab}[aria-selected="true"] &`]: {
      opacity: 1,
    },
  },
})

export const tabTitleInput = style({
  minWidth: '120px',
})

export const resultContainer = style({
  position: 'relative',
  flex: '1 1 0%',
  minWidth: 0,
  minHeight: 0,
  overflow: 'auto',
})

export const resultCode = style({
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
})

export const metaValue = style({
  wordBreak: 'break-all',
})

export const codeBlock = style({
  maxHeight: '50vh',
  overflow: 'auto',
})

export const noWrap = style({
  whiteSpace: 'nowrap',
})

/**
 * Single-line, ellipsized query preview. @sanity/ui's Code trims its line box with
 * pseudo-elements, so the ellipsis is applied to a wrapper with the code rendered inline.
 */
export const previewCode = style({
  display: 'block',
  minWidth: 0,
  maxWidth: '100%',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})

globalStyle(`${previewCode} pre, ${previewCode} code`, {
  display: 'inline',
  whiteSpace: 'inherit',
})

globalStyle(`${previewCode} pre::before, ${previewCode} pre::after`, {
  content: 'none',
})

/** A bleed button holding a stack of texts that must truncate rather than overflow the list */
export const listItemButton = style({
  minWidth: 0,
})

globalStyle(`${listItemButton} [data-ui="Box"], ${listItemButton} [data-ui="Flex"]`, {
  minWidth: 0,
  maxWidth: '100%',
})

globalStyle(`${listItemButton} > [data-ui="Box"]`, {
  width: '100%',
})
