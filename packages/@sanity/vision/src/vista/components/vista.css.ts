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

/** Result label at the same height as the editor label, aligned with the result's own padding */
export const resultLabel = style([editorLabel, {left: '12px'}])

/** Tab headers of the bottom panels scroll sideways rather than wrap when space is tight */
export const panelTabs = style({
  minWidth: 0,
  overflowX: 'auto',
  scrollbarWidth: 'none',
})

// TabList is an Inline (inline-block children), so it wraps like text unless told otherwise; the
// panel scrolls horizontally instead
globalStyle(`${panelTabs} [data-ui="TabList"]`, {
  whiteSpace: 'nowrap',
})

/** Option fields flow into as many columns as fit the request column */
export const optionsGrid = style({
  display: 'grid',
  gap: '12px',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
})

/** Hides the request or response pane in the single-column phone layout */
export const hiddenPane = style({
  selectors: {
    '&&': {
      display: 'none',
    },
  },
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

const SIDEBAR_RAIL_WIDTH = 49

export const sidebarRail = style({
  flexShrink: 0,
  transition: 'width 120ms ease-out',
})

export const sidebarRailCollapsed = style({
  width: `${SIDEBAR_RAIL_WIDTH}px`,
})

export const sidebarRailExpanded = style({
  width: '224px',
})

/** On phones the expanded rail floats over the content instead of squeezing it */
export const sidebarRailOverlay = style({
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: 0,
  // Above the floating editor labels (10) and the split pane resizers
  zIndex: 21,
  background: 'var(--card-bg-color)',
  boxShadow: '0 0 0 1px var(--card-border-color)',
})

/** Keeps the collapsed rail's room reserved while the expanded rail floats over the content */
export const sidebarSlot = style({
  position: 'relative',
  flexShrink: 0,
  width: `${SIDEBAR_RAIL_WIDTH}px`,
})

export const sidebarDrawer = style({
  width: '300px',
  flexShrink: 0,
  minHeight: 0,
  background: 'var(--card-bg-color)',
})

/** On phones the drawer covers the tabs area instead of leaving it a sliver */
export const sidebarDrawerOverlay = style({
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: `${SIDEBAR_RAIL_WIDTH}px`,
  right: 0,
  width: 'auto',
  zIndex: 20,
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
    '&[data-selected="true"]': {
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
    [`${tab}:hover &, ${tab}:focus-within &, ${tab}[data-selected="true"] &`]: {
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

export const codeBlock = style({
  maxHeight: '50vh',
  overflow: 'auto',
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
