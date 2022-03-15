import {SanityTool} from '../config'

export interface SanityPlugin {
  name: string
  schemaTypes?: any[]
  tools?: SanityTool[]
}

export interface ResolvedSanityPlugin {
  name: string
  schemaTypes: any[]
  tools: SanityTool[]
}
