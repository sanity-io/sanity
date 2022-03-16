import {DiffComponent, DiffComponentOptions, ObjectDiff} from '@sanity/base/field'
import {ObjectSchemaType} from '@sanity/types'

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

export interface GeopointSchemaType extends ObjectSchemaType {
  diffComponent?: DiffComponent<ObjectDiff<Geopoint>> | DiffComponentOptions<ObjectDiff<Geopoint>>
}
