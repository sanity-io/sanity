export interface MediaDimensions {
  width?: number
  height?: number
  fit?: 'clip' | 'crop' | 'fill' | 'fillmax' | 'max' | 'scale' | 'min'
  dpr?: number
  aspect?: number
}
