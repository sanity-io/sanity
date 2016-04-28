import React from 'react'
// import {Router, Route, NotFound, Redirect} from 'router:@sanity/base/router'
import tools from 'all:tool:@sanity/base/tool'

function RenderTool(props) {
  const activeToolName = props.params.tool

  if (!tools.length) {
    return <div>No tools fulfills the role <code>`tool:@sanity/base/tool`</code></div>
  }

  const activeTool = tools.find(tool => tool.name === activeToolName)
  console.log('activetool', activeTool)

  if (!activeTool) {
    return <div>Tool not found: {activeToolName}</div>
  }
  return <activeTool.component {...props} />
}

export default RenderTool

