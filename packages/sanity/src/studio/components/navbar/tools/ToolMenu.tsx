import React from 'react'
import {Tool} from '../../../../config'
import {ToolCollapseMenu} from './ToolCollapseMenu'
import {ToolVerticalMenu} from './ToolVerticalMenu'

export interface ToolMenuProps {
  activeToolName?: string
  closeSidebar: () => void
  context: 'sidebar' | 'topbar'
  isSidebarOpen: boolean
  tools: Tool[]
}

export function ToolMenu(props: ToolMenuProps) {
  const {context, isSidebarOpen, ...restProps} = props

  if (context === 'sidebar') {
    return <ToolVerticalMenu isVisible={isSidebarOpen} {...restProps} />
  }

  return <ToolCollapseMenu {...restProps} />
}
