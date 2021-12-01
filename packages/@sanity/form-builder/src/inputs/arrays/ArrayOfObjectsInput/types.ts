import type {ComponentType} from 'react'
import {Path} from '@sanity/types'

export type InsertPosition = 'before' | 'after'
export type ModalType = 'modal' | 'fullscreen' | string

export type ArrayMember = {
  _type?: string
  _key: string
  [key: string]: any
}

export interface InsertEvent {
  position: InsertPosition
  item: ArrayMember
  path: Path
  edit?: boolean
}
export type ReferenceItemComponentType = ComponentType<any>
