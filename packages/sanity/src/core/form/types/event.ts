import {KeyedSegment, SchemaType} from '@sanity/types'
import {Uploader} from '../studio'

/** @beta */
export interface ArrayInputInsertEvent<Item> {
  items: Item[]
  position: 'before' | 'after'
  referenceItem: KeyedSegment | number
  skipInitialValue?: boolean
  open?: boolean
}

/** @beta */
export interface ArrayInputMoveItemEvent {
  fromIndex: number
  toIndex: number
}

/** @beta */
export interface UploadEvent {
  file: File
  schemaType: SchemaType
  uploader: Uploader
}
