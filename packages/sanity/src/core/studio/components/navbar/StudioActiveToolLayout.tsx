import {createElement} from 'react'

import {type Tool} from '../../../config'

interface StudioActiveToolLayoutProps {
  activeTool: Tool
}

export function StudioActiveToolLayout(props: StudioActiveToolLayoutProps) {
  const {activeTool} = props
  return createElement(activeTool.component, {tool: activeTool})
}
