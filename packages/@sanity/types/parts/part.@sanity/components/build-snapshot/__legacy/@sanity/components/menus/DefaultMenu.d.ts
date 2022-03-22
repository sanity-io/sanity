import type React from 'react'
import {MenuItemGroup as MenuItemGroupType, MenuItem as MenuItemType} from './types'
interface DefaultMenuProps {
  id?: string
  onAction: (item: MenuItemType) => void
  className?: string
  onClose?: (event?: KeyboardEvent) => void
  items: MenuItemType[]
  groups?: MenuItemGroupType[]
  router?: {
    navigateIntent: (intentName: string, params?: Record<string, string>) => void
  }
}
declare const _default: React.ComponentClass<DefaultMenuProps, any>
export default _default
