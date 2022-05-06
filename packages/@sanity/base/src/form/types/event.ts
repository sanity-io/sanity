import {KeyedSegment, SchemaType} from '@sanity/types'

export interface InsertItemEvent {
  items: unknown[]
  position: 'before' | 'after'
  referenceItem: KeyedSegment | number
}

export interface MoveItemEvent {
  fromIndex: number
  toIndex: number
}
