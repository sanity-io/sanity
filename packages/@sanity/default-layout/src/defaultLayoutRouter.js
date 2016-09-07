import {createRoute, createScope} from '@sanity/state-router'
import tools from 'all:tool:@sanity/base/tool'

export default createRoute('/some-site/:tool/*', params => {
  const tool = tools.find(tool => tool.name === params.tool)
  return createScope(tool.name, tool.router)
})
