/** How tall a bottom panel is when sized to its content, in pixels */
export interface PanelFitMeasurement {
  headerHeight: number
  contentHeight: number
  /** The split's height, footer excluded */
  containerHeight: number
  /** Room the main area keeps */
  minMainHeight: number
  /** The divider's own extent, which the panes do not include */
  handleSize: number
}

/**
 * The bottom pane's size so its content fits, and no taller than the split can give it. `null`
 * while the split is not laid out (hidden, or not yet measured).
 */
export function bottomPanelSizeToFit(measurement: PanelFitMeasurement): number | null {
  const {headerHeight, contentHeight, containerHeight, minMainHeight, handleSize} = measurement
  if (containerHeight <= 0 || headerHeight <= 0) return null
  const fitted = headerHeight + Math.max(0, contentHeight)
  const max = Math.max(headerHeight, containerHeight - minMainHeight - handleSize)
  return Math.round(Math.min(Math.max(headerHeight, fitted), max))
}

/** Which column of the query tab a bottom panel belongs to */
export type BottomPanelColumn = 'request' | 'response'

export interface DefaultPanelSizeMeasurement {
  column: BottomPanelColumn
  /**
   * How far above the bottom of the column the row the two columns line up on starts: the request
   * panel's toolbar row under its tabs (the params' JSON and Form tabs) and the response panel's
   * tab header
   */
  rowOffset: number
  headerHeight: number
  /** The rule between a panel's tab header and its body */
  bodyBorder: number
  /** The request column's action bar, which its split does not include */
  footerHeight: number
  /** The column's height, footer included; `undefined` until it is measured */
  columnHeight: number | undefined
  minMainHeight: number
  handleSize: number
}

/**
 * A bottom panel's initial size, derived for both columns from one row offset so that the request
 * panel's toolbar row and the response panel's tab header start out level. The offset is held to
 * what the request column can give it, whose split is shorter by its action bar, so the rows stay
 * level in a window too short for the default too.
 */
export function defaultBottomPanelSize(measurement: DefaultPanelSizeMeasurement): number {
  const {column, rowOffset, headerHeight, bodyBorder, footerHeight, columnHeight} = measurement
  const {minMainHeight, handleSize} = measurement
  const maxOffset =
    columnHeight === undefined || columnHeight <= 0
      ? rowOffset
      : columnHeight - footerHeight - minMainHeight - handleSize
  const offset = Math.round(Math.max(headerHeight, Math.min(rowOffset, maxOffset)))
  if (column === 'response') return offset
  // The request panel's row sits under its header, and its split ends above the action bar
  return Math.max(headerHeight, offset - footerHeight + headerHeight + bodyBorder)
}
