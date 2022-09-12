/* eslint-disable camelcase */

import {KeyedSegment, Path} from '@sanity/types'

export type ModalType = 'modal' | 'fullscreen' | string

/**
 * @internal
 */
export type _ArrayInput_ArrayMember = {
  _type?: string
  _key: string
  [key: string]: any
}

/**
 * @internal
 */
export interface _InsertEvent {
  item: _ArrayInput_ArrayMember
  position: 'before' | 'after'
  referenceItem: KeyedSegment | number
  edit?: boolean
}
export type ReferenceItemComponentType = React.ElementType
