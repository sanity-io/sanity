import {detectAvailableEditors, setupMCP} from '../../actions/init-project/setupMCP'
import {type CliCommandDefinition} from '../../types'

const helpText = `
Examples
  # Configure Sanity MCP server for detected AI editors
  sanity mcp add
`

const addMcpCommand: CliCommandDefinition = {
  name: 'add',
  group: 'mcp',
  helpText,
  signature: '',
  description: 'Configure Sanity MCP server for AI editors (Cursor, VS Code, Claude Code)',
  async action(args, context) {
    const {output} = context

    // Check for editors first so we can give helpful feedback
    const detected = await detectAvailableEditors()
    if (detected.length === 0) {
      output.print('No supported AI editors detected (Cursor, VS Code, Claude Code).')
      output.print('Visit https://mcp.sanity.io for manual setup instructions.')
      return
    }

    // Run the MCP setup flow (reuses init logic)
    await setupMCP(context, {skipMcp: false})
  },
}

export default addMcpCommand
