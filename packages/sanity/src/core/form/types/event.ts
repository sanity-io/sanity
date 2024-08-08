import {type KeyedSegment, type SchemaType} from '@sanity/types'

import {type Uploader} from '../studio'

/**
 * @hidden
 * @beta */
export interface ArrayInputInsertEvent<Item> {
  items: Item[]
  position: 'before' | 'after'
  referenceItem: KeyedSegment | number
  skipInitialValue?: boolean
  open?: boolean
}

/**
 * @hidden
 * @beta */
export interface ArrayInputCopyEvent<Item> {
  items: Item[]
}

/**
 * @hidden
 * @beta */
export interface ArrayInputMoveItemEvent {
  fromIndex: number
  toIndex: number
}

/**
 * @hidden
 * @beta */
export interface UploadEvent {
  file: File
  schemaType: SchemaType
  uploader: Uploader
}
