import {Tool} from '../../config'
import {route, Router} from 'sanity/router'

export function createRouter(opts: {basePath?: string; tools: Tool[]}): Router {
  const {basePath = '/', tools} = opts

  const toolRoute = route.create('/:tool', (toolParams) => {
    const tool = tools.find((current) => current.name === toolParams.tool)
    return tool ? route.scope(tool.name, '/', tool.router) : route.create('/')
  })

  return route.create(basePath, [route.intents('/intent'), toolRoute])
}
