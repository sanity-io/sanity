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
