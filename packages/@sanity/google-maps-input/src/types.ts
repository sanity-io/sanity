export interface LatLng {
  lat: number
  lng: number
}

export interface Geopoint {
  _type: 'geopoint'
  lat: number
  lng: number
  alt?: number
}

export interface GeopointSchemaType {
  name: string
  title?: string
  description?: string
}
