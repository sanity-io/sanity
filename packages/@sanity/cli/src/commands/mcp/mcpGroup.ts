import {type CliCommandGroupDefinition} from '../../types'

const mcpGroup: CliCommandGroupDefinition = {
  name: 'mcp',
  signature: '[COMMAND]',
  isGroupRoot: true,
  description: 'Manages MCP (Model Context Protocol) server configuration for AI editors',
}

export default mcpGroup
