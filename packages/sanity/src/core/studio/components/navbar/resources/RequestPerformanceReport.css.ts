import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const chartContainer = style({
  position: 'relative',
})

/** `${(x / CHART_WIDTH) * 100}%`, set by `PointTooltip` */
export const tooltipLeftVar = createVar()
/** `${(y / CHART_HEIGHT) * 100}%`, set by `PointTooltip` */
export const tooltipTopVar = createVar()
/** `translate(…)` derived from the point's x/y, set by `PointTooltip` */
export const tooltipTransformVar = createVar()

export const pointTooltipPositioner = style({
  left: tooltipLeftVar,
  pointerEvents: 'none',
  position: 'absolute',
  top: tooltipTopVar,
  transform: tooltipTransformVar,
  width: '220px',
  zIndex: 1,
})

export const summaryTable = style({
  borderCollapse: 'collapse',
  tableLayout: 'fixed',
  width: '100%',
})

globalStyle(`${summaryTable} th, ${summaryTable} td`, {
  padding: '4px 8px',
})

globalStyle(`${summaryTable} th:first-child, ${summaryTable} td:first-child`, {
  paddingLeft: 0,
  textAlign: 'left',
  width: '36%',
})

globalStyle(`${summaryTable} th:not(:first-child), ${summaryTable} td:not(:first-child)`, {
  fontVariantNumeric: 'tabular-nums',
  textAlign: 'right',
})

globalStyle(`${summaryTable} th:last-child, ${summaryTable} td:last-child`, {
  paddingRight: 0,
})

globalStyle(`${summaryTable} tbody tr`, {
  transition: 'opacity 120ms ease-out',
})

globalStyle(`${summaryTable} tbody tr[data-muted='true']`, {
  opacity: 0.4,
})

export const seriesButton = style({
  alignItems: 'center',
  background: 'none',
  border: 0,
  color: 'inherit',
  cursor: 'pointer',
  display: 'flex',
  font: 'inherit',
  gap: '8px',
  margin: '-4px',
  padding: '4px',
  selectors: {
    '&:focus-visible': {
      borderRadius: '3px',
      outline: '2px solid var(--card-focus-ring-color)',
      outlineOffset: '1px',
    },
  },
})

export const seriesMarker = style({
  flex: 'none',
  height: '12px',
  width: '12px',
})
