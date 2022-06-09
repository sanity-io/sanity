import {ARROW_MARGIN_Y, ARROW_THRESHOLD, CONNECTOR_MARGIN} from '../constants'
import {ConnectorLinePoint, Rect} from './types'

function getConnectorLinePoint(rect: Rect, bounds: Rect): ConnectorLinePoint {
  const centerY = rect.top + rect.height / 2
  const isAbove = rect.top + rect.height < bounds.top + ARROW_MARGIN_Y
  const isBelow = rect.top > bounds.top + bounds.height - ARROW_MARGIN_Y

  return {
    bounds: bounds,
    left: rect.left,
    top: centerY,
    centerY,
    startY: rect.top + CONNECTOR_MARGIN,
    endY: rect.top + rect.height - CONNECTOR_MARGIN,
    isAbove,
    isBelow,
    outOfBounds: isAbove || isBelow,
  }
}

interface Connector {
  from: {rect: Rect; bounds: Rect}
  to: {rect: Rect; bounds: Rect}
}

export function mapConnectorToLine(connector: Connector): {
  from: ConnectorLinePoint
  to: ConnectorLinePoint
} {
  const fromBounds = {
    top: connector.from.bounds.top + ARROW_THRESHOLD,
    bottom: connector.from.bounds.top + connector.from.bounds.height - ARROW_THRESHOLD,
    left: connector.from.bounds.left,
    right: connector.from.bounds.left + connector.from.bounds.width,
    width: connector.from.bounds.width,
    height: connector.from.bounds.height - ARROW_THRESHOLD * 2,
  }

  const from = getConnectorLinePoint(connector.from.rect, fromBounds)
  from.left = connector.from.rect.left + connector.from.rect.width + 1

  const toBounds = {
    top: connector.to.bounds.top + ARROW_THRESHOLD,
    bottom: connector.to.bounds.top + connector.to.bounds.height - ARROW_THRESHOLD,
    left: connector.to.bounds.left,
    right: connector.to.bounds.left + connector.to.bounds.width,
    width: connector.to.bounds.width,
    height: connector.to.bounds.height - ARROW_THRESHOLD * 2,
  }

  const to = getConnectorLinePoint(connector.to.rect, toBounds)

  const maxStartY = Math.max(to.startY, from.startY)

  // Align from <-> to vertically
  from.top = Math.min(maxStartY, from.endY)
  if (from.top < toBounds.top) {
    from.top = Math.min(toBounds.top, from.endY)
  } else if (from.top > toBounds.bottom) {
    from.top = Math.max(toBounds.bottom, from.startY)
  }
  to.top = Math.min(maxStartY, to.endY)
  if (to.top < fromBounds.top) {
    to.top = Math.min(fromBounds.top, to.endY)
  } else if (to.top > fromBounds.bottom) {
    to.top = Math.max(fromBounds.bottom, to.startY)
  }

  // Keep within bounds
  from.top = Math.min(Math.max(from.top, fromBounds.top), fromBounds.bottom)
  to.top = Math.min(Math.max(to.top, toBounds.top), toBounds.bottom)

  return {from, to}
}
