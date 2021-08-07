import {InitialValueTemplateItem} from '@sanity/structure/lib/InitialValueTemplateItem'
import React from 'react'
import {MenuItem, MenuItemGroup} from '../menus/types'
interface DefaultPaneProps {
  color?: 'success' | 'warning' | 'danger'
  hasTabs?: boolean
  tabIdPrefix?: string
  viewId?: string
  title?: React.ReactNode
  isCollapsed?: boolean
  onExpand?: (index: number) => void
  onCollapse?: (index: number) => void
  children?: React.ReactNode
  isLoading?: boolean
  isSelected?: boolean
  isScrollable?: boolean
  hasSiblings?: boolean
  onAction?: (item: MenuItem) => boolean
  renderActions?: (actions: MenuItem[]) => React.ReactNode
  menuItems?: MenuItem[]
  menuItemGroups?: MenuItemGroup[]
  initialValueTemplates?: InitialValueTemplateItem[]
  index: number
  footer?: React.ReactNode
  renderHeaderViewMenu?: () => React.ReactNode
  styles?: Record<string, string>
}
declare const _default: React.ComponentType<DefaultPaneProps>
export default _default
