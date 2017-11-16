import {route} from 'part:@sanity/base/router'
import tools from 'all:part:@sanity/base/tool'
import getConfiguredSpaces from './util/getConfiguredSpaces.js'

export default route('/', [
  route.intents('/intent'),
  route('/:space', params => {
    const foundSpace = getConfiguredSpaces().find(sp => sp.name === params.space)
    return foundSpace && route('/:tool', toolParams => {
      const foundTool = tools.find(current => current.name === toolParams.tool)
      return foundTool && route.scope(foundTool.name, '/', foundTool.router)
    })

  })
])
