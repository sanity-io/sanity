import type {Tool} from '../../config'
import {route, type Router} from 'sanity/router'

export function createRouter(opts: {basePath?: string; tools: Tool[]}): Router {
  const {basePath = '/', tools} = opts

  const toolRoute = route.create('/:tool', (toolParams) => {
    let tool = tools.find((current) => current.name === toolParams.tool)

    // If the URL is targeting the `desk` tool, but no such tool exists, check if we have a
    // `structure` tool instead. If so, this is likely a legacy URL, so we'll redirect to
    // the new one (structure). Note that this is not enough to make the legacy URL work,
    // it will still trigger a "Tool not found" condition in the layout component, but it
    // will be handled there with a redirect. Open to suggestions for better solutions.
    if (!tool && toolParams.tool === 'desk') {
      tool = tools.find((current) => current.name === 'structure')
    }

    return tool ? route.scope(tool.name, '/', tool.router) : route.create('/')
  })

  return route.create(basePath, [route.intents('/intent'), toolRoute])
}
