import type {Tool} from '../../../config/types'

interface StudioActiveToolLayoutProps {
  activeTool: Tool
}

export function StudioActiveToolLayout(props: StudioActiveToolLayoutProps) {
  const {activeTool} = props
  const Component = activeTool.component
  return <Component tool={activeTool} />
}
