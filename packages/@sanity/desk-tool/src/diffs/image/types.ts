type Hotspot = {
  height: number
  width: number
  x: number
  y: number
}

type Crop = {
  bottom: number
  left: number
  right: number
  top: number
}

export interface ImagePreviewProps {
  value: any // TODO
  action: 'changed' | 'added' | 'removed'
  hotspot?: Hotspot
  crop?: Crop
}
