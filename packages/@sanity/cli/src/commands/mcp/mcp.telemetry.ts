import {defineTrace} from '@sanity/telemetry'

import {type EditorName} from '../../actions/mcp/editorConfigs'

interface MCPConfigureTraceData {
  detectedEditors: EditorName[]
  configuredEditors: EditorName[]
}

export const MCPConfigureTrace = defineTrace<MCPConfigureTraceData>({
  name: 'CLI MCP Configure Completed',
  version: 1,
  description: 'User completed MCP configuration via CLI',
})
