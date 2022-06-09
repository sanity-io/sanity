import React from 'react'
import {Tool} from '../../../../config'
import {ToolCollapseMenu} from './ToolCollapseMenu'
import {ToolVerticalMenu} from './ToolVerticalMenu'

export interface ToolMenuProps {
  activeToolName?: string
  context: 'drawer' | 'topbar'
  isDrawerOpen: boolean
  tools: Tool[]
  closeDrawer: () => void
}

export function ToolMenu(props: ToolMenuProps) {
  const {context, isDrawerOpen, ...restProps} = props

  if (context === 'drawer') {
    return <ToolVerticalMenu isVisible={isDrawerOpen} {...restProps} />
  }

  return <ToolCollapseMenu {...restProps} />
}
