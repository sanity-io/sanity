// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import pluginConfig from 'config:@sanity/default-layout'
import {Tool} from '../types'
import {getRegisteredTools} from './getRegisteredTools'

export default function getOrderedTools(): Tool[] {
  const config = pluginConfig.toolSwitcher || {}
  const order = config.order || []
  const hidden = config.hidden || []
  const tools = getRegisteredTools()

  if (!order.length && !hidden.length) {
    return tools
  }

  const keyed = tools.reduce((target, tool) => {
    const title = tool.title || '<unknown>'

    if (!tool.name) {
      console.warn(`Tool "${title}" does not have the required "name"-property`) // eslint-disable-line no-console
      return target
    }

    if (target[tool.name]) {
      const existing = target[tool.name].tool.title
      console.warn(`Tools with duplicate name "${tool.name}" found ("${title}" and "${existing}")`) // eslint-disable-line no-console
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

  return tools.filter(isVisible).sort((tool1, tool2) => {
    const toolA = keyed[tool1.name]
    const toolB = keyed[tool2.name]

    const indexA = toolA ? toolA.index : +Infinity
    const indexB = toolB ? toolB.index : +Infinity

    if (indexA === indexB) {
      return 0
    }

    return indexA - indexB
  })
}
