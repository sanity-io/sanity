import {css} from '#styled-system/css'

export const chartContainer = css({
  position: 'relative',
})

/** `${(x / CHART_WIDTH) * 100}%`, set by `PointTooltip` */
export const tooltipLeftVar = '--request-performance-report-tooltip-left'
/** `${(y / CHART_HEIGHT) * 100}%`, set by `PointTooltip` */
export const tooltipTopVar = '--request-performance-report-tooltip-top'
/** `translate(…)` derived from the point's x/y, set by `PointTooltip` */
export const tooltipTransformVar = '--request-performance-report-tooltip-transform'

export const pointTooltipPositioner = css({
  left: `var(${tooltipLeftVar})`,
  pointerEvents: 'none',
  position: 'absolute',
  top: `var(${tooltipTopVar})`,
  transform: `var(${tooltipTransformVar})`,
  width: '220px',
  zIndex: 1,
})

export const summaryTable = css({
  'borderCollapse': 'collapse',
  'tableLayout': 'fixed',
  'width': '100%',
  '& th, & td': {
    padding: '4px 8px',
  },
  '& th:first-child, & td:first-child': {
    paddingLeft: 0,
    textAlign: 'left',
    width: '36%',
  },
  '& th:not(:first-child), & td:not(:first-child)': {
    fontVariantNumeric: 'tabular-nums',
    textAlign: 'right',
  },
  '& th:last-child, & td:last-child': {
    paddingRight: 0,
  },
  '& tbody tr': {
    transition: 'opacity 120ms ease-out',
  },
  "& tbody tr[data-muted='true']": {
    opacity: 0.4,
  },
})

export const seriesButton = css({
  'alignItems': 'center',
  'background': 'none',
  'border': 0,
  'color': 'inherit',
  'cursor': 'pointer',
  'display': 'flex',
  'font': 'inherit',
  'gap': '8px',
  'margin': '-4px',
  'padding': '4px',
  '&:focus-visible': {
    borderRadius: '3px',
    outline: '2px solid var(--card-focus-ring-color)',
    outlineOffset: '1px',
  },
})

export const seriesMarker = css({
  flex: 'none',
  height: '12px',
  width: '12px',
})
