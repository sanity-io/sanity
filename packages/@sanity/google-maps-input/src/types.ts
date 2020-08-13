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
  name: 'geopoint'
  title?: string
  description?: string
}

export interface ArraySchemaType {
  name: 'array'
  of: {name: string}[]
}

// @todo replace
export type Annotation = {author: string}
