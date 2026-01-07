import {existsSync} from 'node:fs'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import execa from 'execa'

import {debug} from '../../debug'
import {type CliApiClient, type CliCommandContext, type CliPrompter} from '../../types'
import {getCliToken} from '../../util/clientWrapper'

const MCP_SERVER_URL = 'https://mcp.sanity.io'

export const NO_EDITORS_DETECTED_MESSAGE = `Couldn't auto-configure Sanity MCP server for your editor. Visit ${MCP_SERVER_URL} for setup instructions.`

export type EditorName = 'Cursor' | 'VS Code' | 'Claude Code'

export interface Editor {
  name: EditorName
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

export interface MCPSetupResult {
  detectedEditors: EditorName[]
  configuredEditors: EditorName[]
  skipped: boolean
  error?: Error
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
async function promptForMCPSetup(
  prompt: CliPrompter,
  detectedEditors: Editor[],
  editorsWithExisting: Editor[],
): Promise<Editor[] | null> {
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
      message: 'Configure Sanity MCP server?',
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
 * Create a child token for MCP usage
 * This token is tied to the parent CLI token and will be invalidated
 * when the parent token is invalidated (e.g., on logout)
 */
async function createMCPToken(apiClient: CliApiClient): Promise<string> {
  const parentToken = getCliToken()
  if (!parentToken) {
    throw new Error('Not authenticated. Please run `sanity login` first.')
  }

  const client = apiClient({requireUser: true, requireProject: false})
    .clone()
    .config({apiVersion: '2025-12-09'})

  const sessionResponse = await client.request<{sid: string; id: string}>({
    method: 'POST',
    uri: '/auth/session/create',
    body: {
      sourceId: 'sanity-mcp',
      withStamp: false,
    },
  })

  const tokenResponse = await client.request<{token: string; label: string}>({
    method: 'GET',
    uri: '/auth/fetch',
    query: {sid: sessionResponse.sid},
  })

  return tokenResponse.token
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
async function writeMCPConfig(editor: Editor, token: string): Promise<void> {
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
  options: {mcp?: boolean},
): Promise<MCPSetupResult> {
  const {output, prompt} = context

  // 1. Check for explicit opt-out
  if (options.mcp === false) {
    output.warn('Skipping MCP configuration due to --no-mcp flag')
    return {
      detectedEditors: [],
      configuredEditors: [],
      skipped: true,
    }
  }

  // 2. Detect editors
  const detected = await detectAvailableEditors()
  const detectedEditors = detected.map((e) => e.name)

  if (detected.length === 0) {
    output.warn(NO_EDITORS_DETECTED_MESSAGE)
    return {
      detectedEditors,
      configuredEditors: [],
      skipped: true,
    }
  }

  // 3. Check for existing config BEFORE prompting
  const editorsWithExisting = await getEditorsWithExistingConfig(detected)

  // 4. Prompt user (shows existing config status, only pre-selects unconfigured editors)
  const selected = await promptForMCPSetup(prompt, detected, editorsWithExisting)

  if (!selected || selected.length === 0) {
    // User deselected all editors
    return {
      detectedEditors,
      configuredEditors: [],
      skipped: true,
    }
  }

  // 5. Create child token for MCP
  let token: string
  try {
    token = await createMCPToken(context.apiClient)
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    output.warn(`Could not configure MCP: ${err.message}`)
    output.warn('You can set up MCP manually later using https://mcp.sanity.io')
    return {
      detectedEditors,
      configuredEditors: [],
      skipped: false,
      error: err,
    }
  }

  // 6. Write configs for each selected editor
  try {
    for (const editor of selected) {
      await writeMCPConfig(editor, token)
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    output.warn(`Could not configure MCP: ${err.message}`)
    output.warn('You can set up MCP manually later using https://mcp.sanity.io')
    return {
      detectedEditors,
      configuredEditors: [],
      skipped: false,
      error: err,
    }
  }

  const configuredEditors = selected.map((e) => e.name)
  output.success(`MCP configured for ${configuredEditors.join(', ')}`)

  return {
    detectedEditors,
    configuredEditors,
    skipped: false,
  }
}
