// import {Type} from '@portabletext/editor'

import {type ObjectSchemaType} from '@sanity/types'
import {type ComponentType, type ElementType, type ReactNode} from 'react'

export interface BlockItem {
  handle: () => void
  icon: ElementType
  inline: boolean
  key: string
  type: ObjectSchemaType
}

export interface BlockStyleItem {
  key: string
  style: string
  styleComponent?: ElementType
  title: string
  i18nTitleKey?: string
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
