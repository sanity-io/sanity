// import {Type} from '@sanity/portable-text-editor'

import {ObjectSchemaType} from '@sanity/types'

export interface BlockItem {
  handle: () => void
  icon: React.ElementType
  inline: boolean
  key: string
  type: ObjectSchemaType
}

export interface BlockStyleItem {
  key: string
  style: string
  styleComponent?: React.ElementType
  title: string
}

export interface PTEToolbarAction {
  type: 'annotation' | 'format' | 'listStyle'
  disabled: boolean
  icon?: React.ElementType | string
  handle: (active?: boolean) => void
  hotkeys?: string[]
  key: string
  title: string
}

export interface PTEToolbarActionGroup {
  name: string
  actions: PTEToolbarAction[]
}
