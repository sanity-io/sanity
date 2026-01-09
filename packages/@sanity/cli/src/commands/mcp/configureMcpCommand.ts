import {NO_EDITORS_DETECTED_MESSAGE} from '../../actions/mcp/constants'
import {detectAvailableEditors} from '../../actions/mcp/editors'
import {setupMCP} from '../../actions/mcp/mcp'
import {type CliCommandDefinition} from '../../types'
import {MCPConfigureTrace} from './mcp.telemetry'

const helpText = `
Examples
  # Configure Sanity MCP server for detected AI editors
  sanity mcp configure
`

const configureMcpCommand: CliCommandDefinition = {
  name: 'configure',
  group: 'mcp',
  helpText,
  signature: '',
  description: 'Configure Sanity MCP server for AI editors',
  async action(args, context) {
    const {output, telemetry} = context
    const trace = telemetry.trace(MCPConfigureTrace)

    // Check for editors first so we can give helpful feedback
    const detected = await detectAvailableEditors()
    if (detected.length === 0) {
      output.print(NO_EDITORS_DETECTED_MESSAGE)
      trace.log({
        detectedEditors: [],
        configuredEditors: [],
      })
      trace.complete()
      return
    }

    // Run the MCP setup flow (reuses init logic)
    const mcpResult = await setupMCP(context, {mcp: true})
    trace.log({
      detectedEditors: mcpResult.detectedEditors,
      configuredEditors: mcpResult.configuredEditors,
    })
    if (mcpResult.error) {
      trace.error(mcpResult.error)
    }
    trace.complete()
  },
}

export default configureMcpCommand
