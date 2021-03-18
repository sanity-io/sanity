import type {ComponentType} from 'react'
import {Type} from '@sanity/portable-text-editor'

export interface BlockItem {
  disabled: boolean
  handle: () => void
  icon: ComponentType
  inline: boolean
  key: string
  type: Type
}

export interface BlockStyleItem {
  active: boolean
  key: string
  style: string
  styleComponent: ComponentType | null
  title: string
}

export interface PTEToolbarAction {
  active: boolean
  disabled: boolean
  handle: () => void
  hotkeys?: string[]
  icon: ComponentType
  key: string
  title: string
}

export interface PTEToolbarActionGroup {
  name: string
  actions: PTEToolbarAction[]
}
