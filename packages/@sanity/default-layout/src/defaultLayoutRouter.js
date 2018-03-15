import {route} from 'part:@sanity/base/router'
import tools from 'all:part:@sanity/base/tool'
import {CONFIGURED_SPACES, HAS_SPACES} from './util/spaces'

const toolRoute = route('/:tool', toolParams => {
  const foundTool = tools.find(current => current.name === toolParams.tool)
  return foundTool ? route.scope(foundTool.name, '/', foundTool.router) : route('/')
})

const spaceRoute = route('/:space', params => {
  const foundSpace = CONFIGURED_SPACES.find(sp => sp.name === params.space)
  return foundSpace ? toolRoute : route('/')
})

export default route('/', [route.intents('/intent'), HAS_SPACES ? spaceRoute : toolRoute])
