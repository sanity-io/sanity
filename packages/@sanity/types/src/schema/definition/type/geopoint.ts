import {type RuleDef, type ValidationBuilder} from '../../ruleBuilder'
import {type InitialValueProperty} from '../../types'
import {type BaseSchemaDefinition, type BaseSchemaTypeOptions} from './common'

/**
 * Geographical point representing a pair of latitude and longitude coordinates,
 * stored as degrees, in the World Geodetic System 1984 (WGS 84) format. Also
 * includes an optional `alt` property representing the altitude in meters.
 *
 * @public
 */
export interface GeopointValue {
  /**
   * Type of the object. Must be `geopoint`.
   */
  _type: 'geopoint'

  /**
   * Latitude in degrees
   */
  lat: number

  /**
   * Longitude in degrees
   */
  lng: number

  /**
   * Altitude in meters
   */
  alt?: number
}

/** @public */
export interface GeopointRule extends RuleDef<GeopointRule, GeopointValue> {}

/** @public */
export interface GeopointOptions extends BaseSchemaTypeOptions {}

/** @public */
export interface GeopointDefinition extends BaseSchemaDefinition {
  type: 'geopoint'
  options?: GeopointOptions
  validation?: ValidationBuilder<GeopointRule, GeopointValue>
  initialValue?: InitialValueProperty<any, Omit<GeopointValue, '_type'>>
}
