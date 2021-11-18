import type {ComponentType} from 'react'

export type ModalType = 'modal' | 'fullscreen' | string

export type ArrayMember = {
  _type?: string
  _key: string
  [key: string]: any
}

export type ReferenceItemComponentType = ComponentType<any>
