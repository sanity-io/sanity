import {Tool} from '../../../config'

export function getOrderedTools(tools: Tool[]): Tool[] {
  const pluginConfig: {toolSwitcher?: {order?: string[]; hidden?: string[]}} = {}
  const config = pluginConfig.toolSwitcher || {}
  const order = config.order || []
  const hidden = config.hidden || []

  if (!order.length && !hidden.length) {
    return tools
  }

  const keyed = tools.reduce<Record<string, {index: number; tool: Tool}>>((target, tool) => {
    const title = tool.title || '<unknown>'

    if (!tool.name) {
      console.warn(`Tool "${title}" does not have the required "name" property`)
      return target
    }

    if (target[tool.name]) {
      const existing = target[tool.name].tool.title
      console.warn(`Tools with duplicate name "${tool.name}" found ("${title}" and "${existing}")`)
      return target
    }

    const toolIndex = order.indexOf(tool.name)

    target[tool.name] = {
      tool: tool,
      index: toolIndex === -1 ? +Infinity : toolIndex,
    }

    return target
  }, {})

  const isVisible = (tool: Tool) => hidden.indexOf(tool.name) === -1

  const ret = tools.filter(isVisible)

  ret.sort((tool1, tool2) => {
    const toolA = keyed[tool1.name]
    const toolB = keyed[tool2.name]

    const indexA = toolA ? toolA.index : +Infinity
    const indexB = toolB ? toolB.index : +Infinity

    if (indexA === indexB) {
      return 0
    }

    return indexA - indexB
  })

  return ret
}
