import {existsSync} from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'

import {applyEdits, modify} from 'jsonc-parser'
import {parse as parseToml, stringify as stringifyToml} from 'smol-toml'

import {type CliApiClient, type CliCommandContext, type CliPrompter} from '../../types'
import {getCliToken} from '../../util/clientWrapper'
import {NO_EDITORS_DETECTED_MESSAGE} from './constants'
import {EDITOR_CONFIGS, type EditorName} from './editorConfigs'
import {detectAvailableEditors, type Editor} from './editors'

export interface MCPSetupResult {
  detectedEditors: EditorName[]
  configuredEditors: EditorName[]
  skipped: boolean
  error?: Error
}

interface TomlConfig {
  [key: string]: Record<string, unknown> | undefined
}

/**
 * Prompt user to select which editors to configure
 * Shows existing config status - unconfigured editors are pre-selected,
 * configured editors show "(already installed)" and are not pre-selected
 */
async function promptForMCPSetup(prompt: CliPrompter, editors: Editor[]): Promise<Editor[] | null> {
  const editorChoices = editors.map((e) => ({
    name: e.configured ? `${e.name} (already installed)` : e.name,
    value: e.name,
    checked: !e.configured, // Only pre-select if NOT already configured
  }))

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

  return editors.filter((e) => selectedNames.includes(e.name))
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
 * Write MCP configuration to editor config file
 * Uses jsonc-parser's modify/applyEdits to preserve comments
 *
 * Note: Config parseability is already validated in detectAvailableEditors()
 */
async function writeMCPConfig(editor: Editor, token: string): Promise<void> {
  const configPath = editor.configPath
  const {configKey, buildServerConfig, format} = EDITOR_CONFIGS[editor.name]
  const serverConfig = buildServerConfig(token)

  // Read existing content or start with empty object/document
  let content = format === 'toml' ? '' : '{}'
  if (existsSync(configPath)) {
    const fileContent = await fs.readFile(configPath, 'utf-8')
    if (fileContent.trim()) {
      content = fileContent
    }
  }

  if (format === 'toml') {
    const tomlConfig = content.trim() ? (parseToml(content) as TomlConfig) : {}
    const existingServers = tomlConfig[configKey]

    tomlConfig[configKey] = {
      ...(existingServers && typeof existingServers === 'object' ? existingServers : {}),
      Sanity: serverConfig,
    }

    content = stringifyToml(tomlConfig)
  } else {
    // Modify using jsonc-parser - preserves comments
    // Setting a nested path automatically creates intermediate objects
    const edits = modify(content, [configKey, 'Sanity'], serverConfig, {
      formattingOptions: {tabSize: 2, insertSpaces: true},
    })
    content = applyEdits(content, edits)
  }

  // Ensure parent directory exists and write
  await fs.mkdir(path.dirname(configPath), {recursive: true})
  await fs.writeFile(configPath, content, 'utf-8')
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

  // 2. Detect available editors (filters out unparseable configs)
  const editors = await detectAvailableEditors()
  const detectedEditors = editors.map((e) => e.name)

  if (editors.length === 0) {
    output.warn(NO_EDITORS_DETECTED_MESSAGE)
    return {
      detectedEditors,
      configuredEditors: [],
      skipped: true,
    }
  }

  // 3. Prompt user (shows existing config status, only pre-selects unconfigured editors)
  const selected = await promptForMCPSetup(prompt, editors)

  if (!selected || selected.length === 0) {
    // User deselected all editors
    return {
      detectedEditors,
      configuredEditors: [],
      skipped: true,
    }
  }

  // 4. Create child token for MCP
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

  // 5. Write configs for each selected editor
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
