import {type ComponentType} from 'react'

import {type RuleDef, type ValidationBuilder} from '../../ruleBuilder'
import {type InitialValueProperty} from '../../types'
import {
  type BlockAnnotationProps,
  type BlockProps,
  type ObjectFieldProps,
  type ObjectInputProps,
  type ObjectItem,
  type ObjectItemProps,
  type PreviewProps,
} from '../props'
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

/**
 *
 * @hidden
 * @beta
 */
export interface GeopointComponents {
  annotation?: ComponentType<BlockAnnotationProps>
  block?: ComponentType<BlockProps>
  diff?: ComponentType<any>
  field?: ComponentType<ObjectFieldProps<GeopointValue>>
  inlineBlock?: ComponentType<BlockProps>
  input?: ComponentType<ObjectInputProps<GeopointValue>>
  item?: ComponentType<ObjectItemProps<GeopointValue & ObjectItem>>
  preview?: ComponentType<PreviewProps>
}

/** @public */
export interface GeopointDefinition extends BaseSchemaDefinition {
  type: 'geopoint'
  options?: GeopointOptions
  validation?: ValidationBuilder<GeopointRule, GeopointValue>
  initialValue?: InitialValueProperty<any, Omit<GeopointValue, '_type'>>
  /**
   *
   * @hidden
   * @beta
   */
  components?: GeopointComponents
}
