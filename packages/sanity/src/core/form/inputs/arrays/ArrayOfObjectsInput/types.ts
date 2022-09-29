/* eslint-disable camelcase */

import type {ComponentType} from 'react'
import {KeyedSegment} from '@sanity/types'

export type ModalType = 'modal' | 'fullscreen' | string

/** @public */
export type ArrayInputMember = {
  _type?: string
  _key: string
  [key: string]: any
}

/** @public */
export interface InsertEvent {
  item: ArrayInputMember
  position: 'before' | 'after'
  referenceItem: KeyedSegment | number
  edit?: boolean
}

/** @internal */
export type ReferenceItemComponentType = ComponentType<any>
