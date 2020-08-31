export interface Rect {
  height: number
  width: number
  top: number
  left: number
}

export interface ReportedRegion<RegionData> {
  id: string
  children?: React.ReactNode
  rect: Rect
  data: RegionData
}
