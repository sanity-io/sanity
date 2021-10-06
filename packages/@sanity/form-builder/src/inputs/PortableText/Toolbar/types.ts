import {Type} from '@sanity/portable-text-editor'

export interface BlockItem {
  disabled: boolean
  handle: () => void
  icon: React.ComponentType
  inline: boolean
  key: string
  type: Type
}

export interface BlockStyleItem {
  key: string
  style: string
  styleComponent: React.ComponentType | null
  title: string
}

export interface PTEToolbarAction {
  type: 'annotation' | 'format' | 'listStyle'
  disabled: boolean
  icon?: React.ComponentType | string
  handle: () => void
  hotkeys?: string[]
  key: string
  title: string
}

export interface PTEToolbarActionGroup {
  name: string
  actions: PTEToolbarAction[]
}
