import type {ComponentType} from 'react'
import {KeyedSegment, Path} from '@sanity/types'

export type ModalType = 'modal' | 'fullscreen' | string

export type ArrayMember = {
  _type?: string
  _key: string
  [key: string]: any
}

/**
 *  @deprecated
 *  */
export interface InsertEvent {
  item: ArrayMember
  position: 'before' | 'after'
  referenceItem: KeyedSegment | number
  edit?: boolean
}
export type ReferenceItemComponentType = ComponentType<any>
