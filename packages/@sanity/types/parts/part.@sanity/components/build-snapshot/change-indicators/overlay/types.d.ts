export interface ConnectorLinePoint {
  bounds: {
    top: number
    left: number
    height: number
    width: number
  }
  left: number
  top: number
  startY: number
  centerY: number
  endY: number
  isAbove: boolean
  isBelow: boolean
  outOfBounds: boolean
}
export interface ConnectorLine {
  from: ConnectorLinePoint
  to: ConnectorLinePoint
}
export declare type Rect = {
  left: number
  top: number
  height: number
  width: number
}
