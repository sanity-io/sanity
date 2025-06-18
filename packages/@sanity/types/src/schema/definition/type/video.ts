import {type AssetSource} from '../../../assets'
import {type Reference} from '../../../reference'
import {type RuleDef, type ValidationBuilder} from '../../ruleBuilder'
import {type InitialValueProperty} from '../../types'
import {type ObjectDefinition, type ObjectOptions} from './object'

/** @public */
export interface VideoOptions extends ObjectOptions {
  storeOriginalFilename?: boolean
  accept?: string
  sources?: AssetSource[]
}

/** @public */
export interface VideoRule extends RuleDef<VideoRule, VideoValue> {
  /**
   * Require a video field has an asset.
   *
   * @example
   * ```ts
   * defineField({
   *  name: 'video',
   *  title: 'Video',
   *  type: 'video',
   *  validation: (Rule) => Rule.required().assetRequired(),
   * })
   * ```
   */
  assetRequired(): VideoRule
}

/** @public */
export interface VideoValue {
  asset?: Reference
  [index: string]: unknown
}

/** @public */
export interface VideoDefinition
  extends Omit<ObjectDefinition, 'type' | 'fields' | 'options' | 'groups' | 'validation'> {
  type: 'video'
  fields?: ObjectDefinition['fields']
  options?: VideoOptions
  validation?: ValidationBuilder<VideoRule, VideoValue>
  initialValue?: InitialValueProperty<any, VideoValue>
}
