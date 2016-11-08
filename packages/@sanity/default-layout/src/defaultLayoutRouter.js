import {createRoute, createScope} from 'part:@sanity/base/router'
import tools from 'all:part:@sanity/base/tool'

export default createRoute('/some-site/:tool/*', params => {
  const tool = tools.find(tool => tool.name === params.tool)
  return createScope(tool.name, tool.router)
})
