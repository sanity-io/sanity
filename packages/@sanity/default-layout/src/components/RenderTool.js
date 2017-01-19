import React, {PropTypes} from 'react'
import tools from 'all:part:@sanity/base/tool'

function RenderTool(props) {
  if (!tools.length) {
    return <div>No tools fulfills the part <code>`part:@sanity/base/tool`</code></div>
  }

  const activeToolName = props.tool
  const activeTool = tools.find(tool => tool.name === activeToolName)
  if (!activeTool) {
    return <div>Tool not found: {activeToolName}</div>
  }

  const ActiveTool = activeTool.component
  return (
    <ActiveTool {...props} />
  )
}

RenderTool.propTypes = {
  tool: PropTypes.string
}

export default RenderTool
