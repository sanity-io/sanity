import {RuleDef, ValidationBuilder} from '../../ruleBuilder'
import {InitialValueProperty} from '../../types'
import {FieldDefinition} from '../schemaDefinition'
import {FileOptions, FileValue} from './file'
import {ObjectDefinition} from './object'

/** @public */
export type ImageMetadataType = 'blurhash' | 'lqip' | 'palette' | 'exif' | 'location'

/** @public */
export interface ImageOptions extends FileOptions {
  metadata?: ImageMetadataType[]
  hotspot?: boolean
}

/** @public */
export interface ImageValue extends FileValue {
  crop?: {
    top?: number
    bottom?: number
    left?: number
    right?: number
  }
  hotspot?: {
    x?: number
    y?: number
    height: number
    width: number
  }
  [index: string]: unknown
}

/** @public */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ImageRule extends RuleDef<ImageRule, ImageValue> {}

/** @public */
export interface ImageDefinition extends Omit<ObjectDefinition, 'type' | 'fields' | 'options'> {
  type: 'image'
  fields?: FieldDefinition[]
  options?: ImageOptions
  validation?: ValidationBuilder<ImageRule, ImageValue>
  initialValue?: InitialValueProperty<any, ImageValue>
}
