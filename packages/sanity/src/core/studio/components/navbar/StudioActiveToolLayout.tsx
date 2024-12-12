import {createElement} from 'react'

import {type Tool} from '../../../config'

interface StudioActiveToolLayoutProps {
  activeTool: Tool
}

export function StudioActiveToolLayout(props: StudioActiveToolLayoutProps) {
  const {activeTool} = props
  // @TODO should use JSX instead of calling createElement directly
  return createElement(activeTool.component, {tool: activeTool})
}
