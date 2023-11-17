// import {Type} from '@sanity/portable-text-editor'

import {ObjectSchemaType} from '@sanity/types'
import {ComponentType, ReactNode} from 'react'

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
  i18nTitle?: string
}

export interface PTEToolbarAction {
  type: 'annotation' | 'format' | 'listStyle'
  disabled: boolean
  icon?: ReactNode | ComponentType
  handle: (active?: boolean) => void
  hotkeys?: string[]
  key: string
  title: string
}

export interface PTEToolbarActionGroup {
  name: string
  actions: PTEToolbarAction[]
}
