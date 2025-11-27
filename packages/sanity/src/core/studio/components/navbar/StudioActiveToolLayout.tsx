import {type Tool} from '../../../config'

interface StudioActiveToolLayoutProps {
  activeTool: Tool
}

export function StudioActiveToolLayout(props: StudioActiveToolLayoutProps) : React.JSX.Element {
  const {activeTool} = props
  const Component = activeTool.component
  return <Component tool={activeTool} />
}
