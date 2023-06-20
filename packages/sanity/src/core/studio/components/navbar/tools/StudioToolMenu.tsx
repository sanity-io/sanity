import React from 'react'
import {ToolMenuProps} from '../../../../config'
import {ToolCollapseMenu} from './ToolCollapseMenu'
import {ToolVerticalMenu} from './ToolVerticalMenu'

/**
 * @hidden
 * @beta */
export function StudioToolMenu(props: ToolMenuProps) {
  const {context, isSidebarOpen, ...restProps} = props

  if (context === 'sidebar') {
    return <ToolVerticalMenu isVisible={isSidebarOpen} {...restProps} />
  }

  return <ToolCollapseMenu {...restProps} />
}
