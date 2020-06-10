export interface AssetRecord {
  _id?: string
  referenceCount?: number
  url?: string
}

export interface AssetAction {
  color?: 'danger'
  icon?: React.ComponentType
  inverted?: boolean
  name: string
  title: string
}
