import {ConnectorLinePoint, Rect} from './types'
interface Connector {
  from: {
    rect: Rect
    bounds: Rect
  }
  to: {
    rect: Rect
    bounds: Rect
  }
}
export declare function mapConnectorToLine(
  connector: Connector
): {
  from: ConnectorLinePoint
  to: ConnectorLinePoint
}
export {}
