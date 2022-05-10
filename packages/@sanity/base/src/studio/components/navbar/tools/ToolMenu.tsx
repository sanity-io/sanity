import React from 'react'
import {Tool} from '../../../../config'
import {ToolCollapseMenu} from './ToolCollapseMenu'
import {ToolVerticalMenu} from './ToolVerticalMenu'

export interface ToolMenuProps {
  context: 'sidebar' | 'topbar'
  isSidebarOpen: boolean
  onSidebarClose: () => void
  tools: Tool[]
  activeToolName?: string
}

export function ToolMenu(props: ToolMenuProps) {
  const {activeToolName, context, isSidebarOpen, onSidebarClose, tools} = props

  if (context === 'sidebar') {
    return (
      <ToolVerticalMenu
        activeToolName={activeToolName}
        isVisible={isSidebarOpen}
        onSwitchTool={onSidebarClose}
        tools={tools}
      />
    )
  }

  return <ToolCollapseMenu activeToolName={activeToolName} tools={tools} />
}
