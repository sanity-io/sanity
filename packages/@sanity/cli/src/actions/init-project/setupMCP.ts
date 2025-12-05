import {existsSync} from 'node:fs'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import chalk from 'chalk'
import execa from 'execa'

import {debug} from '../../debug'
import {type CliCommandContext, type CliPrompter} from '../../types'
import {getCliToken} from '../../util/clientWrapper'

const MCP_SERVER_URL = 'https://mcp.sanity.io'

export interface Editor {
  name: 'Cursor' | 'VS Code' | 'Claude Code'
  configPath: string
  configKey: 'servers' | 'mcpServers'
}

interface MCPConfig {
  servers?: Record<string, ServerConfig>
  mcpServers?: Record<string, ServerConfig>
}

interface ServerConfig {
  type: 'http'
  url: string
  headers: {
    Authorization: string
  }
}

/**
 * Detect which editors are installed on the user's machine
 */
export async function detectAvailableEditors(): Promise<Editor[]> {
  const editors: Editor[] = []
  const homeDir = os.homedir()

  // Cursor detection
  const cursorDir = path.join(homeDir, '.cursor')
  if (existsSync(cursorDir)) {
    editors.push({
      name: 'Cursor',
      configPath: path.join(cursorDir, 'mcp.json'),
      configKey: 'mcpServers',
    })
  }

  // VS Code detection (platform-specific)
  let vscodeConfigDir: string | null = null
  switch (process.platform) {
    case 'darwin':
      vscodeConfigDir = path.join(homeDir, 'Library/Application Support/Code/User')
      break
    case 'win32':
      // APPDATA is required on Windows for VS Code config path
      if (process.env.APPDATA) {
        vscodeConfigDir = path.join(process.env.APPDATA, 'Code/User')
      }
      break
    default: // linux
      vscodeConfigDir = path.join(homeDir, '.config/Code/User')
  }

  if (vscodeConfigDir && existsSync(vscodeConfigDir)) {
    editors.push({
      name: 'VS Code',
      configPath: path.join(vscodeConfigDir, 'mcp.json'),
      configKey: 'servers',
    })
  }

  // Claude Code detection
  try {
    await execa('claude', ['--version'], {stdio: 'pipe', timeout: 5000})
    editors.push({
      name: 'Claude Code',
      configPath: path.join(homeDir, '.claude.json'),
      configKey: 'mcpServers',
    })
  } catch {
    // Not installed
  }

  return editors
}

/**
 * Prompt user to select which editors to configure
 * Shows existing config status - unconfigured editors are pre-selected,
 * configured editors show "(select to reconfigure)" and are not pre-selected
 */
export async function promptForMCPSetup(
  prompt: CliPrompter,
  detectedEditors: Editor[],
  editorsWithExisting: Editor[],
  skipMcp: boolean,
): Promise<Editor[] | null> {
  if (skipMcp) {
    // User explicitly opted out via --skip-mcp flag
    return null
  }

  if (detectedEditors.length === 0) {
    // No editors detected, skip silently
    return null
  }

  // Build choices with existing config status
  const editorChoices = detectedEditors.map((e) => {
    const isConfigured = editorsWithExisting.some((existing) => existing.name === e.name)
    return {
      name: isConfigured ? `${e.name} (already installed)` : e.name,
      value: e.name,
      checked: !isConfigured, // Only pre-select if NOT already configured
    }
  })

  const result = await prompt<{selectedEditors: string[]}>([
    {
      type: 'checkbox',
      name: 'selectedEditors',
      message: 'Configure Sanity MCP server',
      choices: editorChoices,
    },
  ])

  const selectedNames = result.selectedEditors

  // User can deselect all to skip
  if (!selectedNames || selectedNames.length === 0) {
    return null
  }

  return detectedEditors.filter((e) => selectedNames.includes(e.name))
}

/**
 * Get the CLI authentication token
 * This token is already authenticated and can be used for MCP
 */
export function getMCPToken(): string {
  const token = getCliToken()

  if (!token) {
    throw new Error('Not authenticated. Please run `sanity login` first.')
  }

  return token
}

/**
 * Check which editors already have Sanity MCP configured
 */
async function getEditorsWithExistingConfig(editors: Editor[]): Promise<Editor[]> {
  const configured: Editor[] = []
  for (const editor of editors) {
    if (existsSync(editor.configPath)) {
      try {
        const content = await fs.readFile(editor.configPath, 'utf-8')
        const config = JSON.parse(content) as MCPConfig
        if (config[editor.configKey]?.Sanity) {
          configured.push(editor)
        }
      } catch (err) {
        debug('Could not read MCP config for %s: %s', editor.name, err)
        // Treat as not configured
      }
    }
  }
  return configured
}

/**
 * Write MCP configuration to editor config file
 * Merges with existing config if present
 * Uses existing CLI authentication token
 */
export async function writeMCPConfig(editor: Editor, token: string): Promise<void> {
  const configPath = editor.configPath

  // 1. Read existing config (if exists)
  let existingConfig: MCPConfig = {}
  if (existsSync(configPath)) {
    try {
      const content = await fs.readFile(configPath, 'utf-8')
      existingConfig = JSON.parse(content)
    } catch (error) {
      debug(`Warning: Could not parse ${configPath}. Creating new config.`)
      // Use empty config (will overwrite)
    }
  }

  // 2. Create/update Sanity server entry
  const serverKey = editor.configKey
  if (!existingConfig[serverKey]) {
    existingConfig[serverKey] = {}
  }

  existingConfig[serverKey].Sanity = {
    type: 'http',
    url: MCP_SERVER_URL,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }

  // 3. Ensure parent directory exists
  await fs.mkdir(path.dirname(configPath), {recursive: true})

  // 4. Write config
  await fs.writeFile(configPath, JSON.stringify(existingConfig, null, 2), 'utf-8')
}

/**
 * Main MCP setup orchestration
 * Opt-out by default: runs automatically unless skipMcp flag is set
 */
export async function setupMCP(
  context: CliCommandContext,
  options: {skipMcp: boolean},
): Promise<Editor[] | null> {
  const {output, prompt} = context

  try {
    // 1. Check for explicit opt-out
    if (options.skipMcp) {
      return null
    }

    // 2. Detect editors
    const detected = await detectAvailableEditors()

    if (detected.length === 0) {
      // No editors found, skip silently (no message)
      return null
    }

    // 3. Check for existing config BEFORE prompting
    const editorsWithExisting = await getEditorsWithExistingConfig(detected)

    // 4. Prompt user (shows existing config status, only pre-selects unconfigured editors)
    const selected = await promptForMCPSetup(prompt, detected, editorsWithExisting, options.skipMcp)

    if (!selected || selected.length === 0) {
      // User deselected all editors
      return null
    }

    // 5. Get CLI token for MCP
    const token = getMCPToken()

    // 6. Write configs for each selected editor
    for (const editor of selected) {
      await writeMCPConfig(editor, token)
      output.print(`${chalk.green('✓')} MCP configured for ${editor.name}`)
    }

    return selected
  } catch (error) {
    // Don't fail init if MCP setup fails
    output.warn(
      `Warning: Could not configure MCP: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
    output.warn('You can set up MCP manually later using https://mcp.sanity.io')
    return null
  }
}
