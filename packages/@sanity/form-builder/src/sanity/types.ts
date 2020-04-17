export type RegionWithIntersectionDetails = {
  distanceTop: number
  distanceBottom: number
  position: 'top' | 'bottom' | 'inside'
  region: Region
}

export type Region = {
  id: string
  data: Data
  rect: {
    top: number
    left: number
    height: number
    width: number
  }
  component: React.ComponentType<Data>
  spacerHeight?: number
}

type Data = {
  presence: any[]
  avatarComponent: React.ComponentType
}
