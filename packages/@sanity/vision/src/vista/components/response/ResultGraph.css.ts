import {createVar, globalStyle, style} from '@vanilla-extract/css'

import {GRAPH_METRICS} from '../../util/resultGraph'

export const graphCodeFamilyVar = createVar()
export const graphCodeSizeVar = createVar()
export const graphPropertyVar = createVar()
export const graphStringVar = createVar()
export const graphNumberVar = createVar()
export const graphBooleanVar = createVar()
export const graphConstantVar = createVar()

/** The area the graph is moved and zoomed in; dragging its background pans */
export const graphViewport = style({
  position: 'relative',
  height: '100%',
  overflow: 'hidden',
  cursor: 'grab',
  touchAction: 'none',
  userSelect: 'none',
  outline: 'none',
  selectors: {
    '&[data-dragging="true"]': {cursor: 'grabbing'},
    '&:focus-visible': {boxShadow: 'inset 0 0 0 2px var(--card-focus-ring-color)'},
  },
})

/** Positioned and scaled as one, so the nodes and the edges move together */
export const graphCanvas = style({
  position: 'absolute',
  top: 0,
  left: 0,
  transformOrigin: '0 0',
})

export const graphEdges = style({
  position: 'absolute',
  top: 0,
  left: 0,
  overflow: 'visible',
  pointerEvents: 'none',
})

globalStyle(`${graphEdges} path`, {
  fill: 'none',
  stroke: 'var(--card-muted-fg-color)',
  strokeOpacity: 0.55,
  strokeWidth: 1.5,
})

export const graphNode = style({
  position: 'absolute',
  boxSizing: 'border-box',
  background: 'var(--card-bg-color)',
  border: '1px solid var(--card-border-color)',
  borderRadius: '6px',
  boxShadow: '0 1px 2px var(--card-shadow-umbra-color)',
  overflow: 'hidden',
  fontFamily: graphCodeFamilyVar,
  fontSize: graphCodeSizeVar,
  cursor: 'default',
})

export const graphNodeHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: '2px',
  height: `${GRAPH_METRICS.headerHeight}px`,
  boxSizing: 'border-box',
  paddingLeft: `${GRAPH_METRICS.paddingX}px`,
  paddingRight: '4px',
  borderBottom: '1px solid var(--card-border-color)',
  background: 'var(--card-muted-bg-color)',
})

export const graphNodeTitle = style({
  flex: '1 1 auto',
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: graphPropertyVar,
  fontWeight: 600,
})

export const graphNodeSummary = style({
  color: 'var(--card-muted-fg-color)',
  fontWeight: 400,
  marginLeft: '0.5ch',
})

export const graphNodeButton = style({
  appearance: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2px',
  flexShrink: 0,
  padding: '2px',
  border: 0,
  borderRadius: '3px',
  background: 'none',
  color: 'var(--card-muted-fg-color)',
  cursor: 'pointer',
  font: 'inherit',
  fontSize: '1.15em',
  lineHeight: 1,
  selectors: {
    '&:hover': {color: 'var(--card-fg-color)', background: 'var(--card-code-bg-color)'},
    '&:focus-visible': {outline: '1px solid var(--card-focus-ring-color)'},
  },
})

export const graphRow = style({
  display: 'flex',
  alignItems: 'center',
  height: `${GRAPH_METRICS.rowHeight}px`,
  paddingLeft: `${GRAPH_METRICS.paddingX}px`,
  paddingRight: `${GRAPH_METRICS.paddingX}px`,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  position: 'relative',
})

export const graphRowKey = style({color: graphPropertyVar, flexShrink: 0})

export const graphRowValue = style({
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  marginLeft: '1ch',
  selectors: {
    '&[data-type="string"]': {color: graphStringVar},
    '&[data-type="number"]': {color: graphNumberVar},
    '&[data-type="boolean"]': {color: graphBooleanVar},
    '&[data-type="null"]': {color: graphConstantVar},
    '&[data-type="child"], &[data-type="more"]': {color: 'var(--card-muted-fg-color)'},
  },
})

/** Where the edge to a nested object or array leaves its row */
export const graphRowPort = style({
  position: 'absolute',
  right: '-3px',
  top: '50%',
  width: '6px',
  height: '6px',
  marginTop: '-3px',
  borderRadius: '50%',
  background: 'var(--card-muted-fg-color)',
})

export const graphControls = style({
  position: 'absolute',
  right: '8px',
  bottom: '8px',
  display: 'flex',
  gap: '2px',
  padding: '2px',
  borderRadius: '4px',
  background: 'var(--card-bg-color)',
  boxShadow: '0 0 0 1px var(--card-border-color)',
  zIndex: 1,
})

export const graphNotice = style({
  position: 'absolute',
  left: '8px',
  bottom: '8px',
  maxWidth: 'calc(100% - 140px)',
  padding: '4px 8px',
  borderRadius: '4px',
  background: 'var(--card-bg-color)',
  boxShadow: '0 0 0 1px var(--card-border-color)',
  zIndex: 1,
})
