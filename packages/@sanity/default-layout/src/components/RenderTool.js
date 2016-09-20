import React from 'react'
import tools from 'all:part:@sanity/base/tool'

export default function RenderTool(props) {
  if (!tools.length) {
    return <div>No tools fulfills the role <code>`part:@sanity/base/tool`</code></div>
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
