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

/** The query editor takes whatever height the panels below leave over, and never less than this */
export const querySection = style({
  position: 'relative',
  display: 'flex',
  flex: '1 1 0%',
  minHeight: '120px',
})

/**
 * A collapsible panel below the query editor: a header row and, while expanded, a body that
 * scrolls once the panel hits its cap. The panel is as tall as its content wants, so the
 * stacking distributes the column's height by need.
 */
export const collapsibleSection = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  flex: '0 1 auto',
  minHeight: 0,
  borderTop: '1px solid var(--card-border-color)',
})

/** Params grow with their JSON until they would claim too much of the column */
export const paramsSection = style({
  maxHeight: '40%',
})

/** A dragged params height replaces the automatic one; the cap is enforced while dragging */
export const paramsSectionResized = style({
  maxHeight: 'none',
})

/** The options are finite and rarely reach this; when they do, they scroll */
export const optionsSection = style({
  maxHeight: '45%',
})

export const sectionBody = style({
  position: 'relative',
  flex: '1 1 auto',
  minHeight: 0,
  overflow: 'auto',
})

/**
 * Drag handle straddling the params panel's top border, laid out like the split pane resizers:
 * an 11px hit area whose visible part is the border itself.
 */
export const sectionResizer = style({
  position: 'absolute',
  top: '-6px',
  left: 0,
  right: 0,
  height: '11px',
  cursor: 'row-resize',
  // Above the editor label (10) so the whole width can be grabbed, below the sidebar (20)
  zIndex: 11,
  touchAction: 'none',
  selectors: {
    '&:hover, &[data-dragging="true"]': {
      background: 'var(--card-shadow-ambient-color)',
    },
    '&:focus-visible': {
      background: 'var(--card-shadow-ambient-color)',
      outline: '2px solid var(--card-focus-ring-color)',
      outlineOffset: '-2px',
    },
  },
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

/**
 * The tab strip: a tinted band whose bottom rule is an inset shadow, so the selected tab's
 * background can cover it and merge with the panel below (a border would be clipped away by the
 * strip's overflow instead).
 */
export const tabBar = style({
  overflowX: 'auto',
  overflowY: 'hidden',
  scrollbarWidth: 'thin',
  flexShrink: 0,
  background: 'var(--card-bg2-color)',
  boxShadow: 'inset 0 -1px 0 var(--card-border-color)',
})

// Bleed buttons paint the card background, which reads as white boxes on the tinted strip
globalStyle(`${tabBar} [data-ui="Button"]:not(:hover)`, {
  backgroundColor: 'transparent',
})

/** The reorderable list of tabs (a motion Reorder.Group rendered as a div) */
export const tabList = style({
  display: 'flex',
  alignItems: 'stretch',
  gap: '2px',
})

/** The draggable wrapper around each tab; motion positions it while dragging and reordering */
export const tabItem = style({
  position: 'relative',
  display: 'flex',
  flexShrink: 0,
  selectors: {
    '&[data-dragging="true"]': {
      zIndex: 1,
    },
  },
})

export const tab = style({
  position: 'relative',
  flexShrink: 0,
  maxWidth: '240px',
  marginTop: '4px',
  border: '1px solid transparent',
  borderBottom: 'none',
  borderRadius: '3px 3px 0 0',
  transition: 'background-color 100ms',
  selectors: {
    '&:hover': {
      background: 'var(--card-muted-bg-color)',
    },
    '&[data-selected="true"]': {
      background: 'var(--card-bg-color)',
      borderColor: 'var(--card-border-color)',
    },
    [`${tabItem}[data-dragging="true"] &`]: {
      boxShadow: '0 2px 6px var(--card-shadow-umbra-color)',
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
