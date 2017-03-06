import {route} from 'part:@sanity/base/router'
import tools from 'all:part:@sanity/base/tool'

export default route('/', [
  route('/:tool', params => {
    const tool = tools.find(current => current.name === params.tool)
    return tool && route.scope(tool.name, '/', tool.router)
  }),
  route.intents('/intent')
])
