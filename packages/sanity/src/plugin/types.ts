import {Tool} from '../config'

export interface SanityPlugin {
  name: string
  schemaTypes?: any[]
  tools?: Tool[]
}

export interface ResolvedSanityPlugin {
  name: string
  schemaTypes: any[]
  tools: Tool[]
}
