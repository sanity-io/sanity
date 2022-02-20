import allTools from 'all:part:@sanity/base/tool'
import {Tool} from '../types'

export function getRegisteredTools(): Tool[] {
  const tools = allTools.filter(Boolean)

  return tools
}
