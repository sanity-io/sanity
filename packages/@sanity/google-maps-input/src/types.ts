export interface LatLng {
  lat: number
  lng: number
}

export interface Geopoint {
  _type: 'geopoint'
  _key?: string
  lat: number
  lng: number
  alt?: number
}

export interface GeopointSchemaType {
  name: string
  title?: string
  description?: string
}

// @todo replace
export type Annotation = {author: string}
