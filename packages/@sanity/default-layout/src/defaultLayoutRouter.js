import {createRoute, createScope} from 'part:@sanity/base/router'
import tools from 'all:part:@sanity/base/tool'

export default createRoute('/:tool/*', params => {
  const tool = tools.find(curr => curr.name === params.tool)

  // @todo implement better handling of errors
  if (!tool) {
    throw new Error(`Tool with name "${params.tool}" not found`)
  }

  return createScope(tool.name, tool.router)
})
