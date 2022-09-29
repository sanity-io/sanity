import {KeyedSegment} from '@sanity/types'

/** @beta */
export interface InsertItemEvent {
  items: unknown[]
  position: 'before' | 'after'
  referenceItem: KeyedSegment | number
}

/** @beta */
export interface MoveItemEvent {
  fromIndex: number
  toIndex: number
}
