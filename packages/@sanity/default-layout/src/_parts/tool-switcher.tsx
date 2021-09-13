/**
 * This component implements the part: `part:@sanity/default-layout/tool-switcher`
 */

import React from 'react'
import {Router, Tool} from '../types'
import VerticalToolMenu from '../navbar/toolMenu/ToolMenu'
import {ToolMenuCollapse as HorizontalToolMenu} from '../navbar/toolMenuCollapse'

interface VerticalToolSwitcherProps {
  direction: 'vertical'
  activeToolName: string
  isVisible: boolean
  onSwitchTool: () => void
  router: Router
  tools: Tool[]
}

interface HorizontalToolSwitcherProps {
  direction: 'horizontal'
  router: Router
  tools: Tool[]
}

type ToolSwitcherProps = VerticalToolSwitcherProps | HorizontalToolSwitcherProps

export default function ToolSwitcher(props: ToolSwitcherProps) {
  const {direction, ...restProps} = props

  if (direction === 'vertical') {
    return <VerticalToolMenu {...(restProps as Omit<VerticalToolSwitcherProps, 'direction'>)} />
  }

  return <HorizontalToolMenu {...(restProps as Omit<HorizontalToolSwitcherProps, 'direction'>)} />
}
