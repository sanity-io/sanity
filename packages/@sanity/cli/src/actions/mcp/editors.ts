import {existsSync} from 'node:fs'
import fs from 'node:fs/promises'

import {parse as parseJsonc, type ParseError} from 'jsonc-parser'
import {parse as parseToml} from 'smol-toml'

import {debug} from '../../debug'
import {EDITOR_CONFIGS, type EditorName} from './editorConfigs'

export interface Editor {
  name: EditorName
  configPath: string
  /** Whether Sanity MCP is already configured for this editor */
  configured: boolean
}

interface MCPConfig {
  [key: string]: Record<string, unknown> | undefined
}

/**
 * Safely parse config file content
 * Returns parsed config or null if unparseable
 */
function parseConfig(content: string, format: 'jsonc' | 'toml'): MCPConfig | null {
  const trimmed = content.trim()
  if (trimmed === '') {
    return {} // Empty file - safe to write, treat as empty config
  }

  if (format === 'toml') {
    try {
      const parsed = parseToml(content)
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return null
      }

      return parsed as MCPConfig
    } catch {
      return null
    }
  }

  const errors: ParseError[] = []
  const parsed = parseJsonc(content, errors, {allowTrailingComma: true})

  if (errors.length > 0 || typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return null // Parse failed
  }

  return parsed as MCPConfig
}

/**
 * Check if an editor's config is usable and whether Sanity MCP is already configured.
 * Returns null only if config exists but can't be parsed (to avoid data loss).
 */
async function checkEditorConfig(name: EditorName, configPath: string): Promise<Editor | null> {
  const {configKey, format} = EDITOR_CONFIGS[name]

  // Config file doesn't exist - can create it
  if (!existsSync(configPath)) {
    return {name, configPath, configured: false}
  }

  // Config exists - try to parse it
  try {
    const content = await fs.readFile(configPath, 'utf-8')
    const config = parseConfig(content, format)

    if (config === null) {
      debug('Skipping %s: could not parse %s', name, configPath)
      return null // Can't parse - skip this editor
    }

    // Check if Sanity MCP is already configured
    const configured = Boolean(config[configKey]?.Sanity)

    return {name, configPath, configured}
  } catch (err) {
    debug('Skipping %s: could not read %s: %s', name, configPath, err)
    return null
  }
}

/**
 * Detect which editors are installed and have parseable configs.
 * Editors with unparseable configs are skipped to avoid data loss.
 */
export async function detectAvailableEditors(): Promise<Editor[]> {
  const editors: Editor[] = []

  for (const [name, config] of Object.entries(EDITOR_CONFIGS)) {
    const configPath = await config.detect()
    if (configPath) {
      const editor = await checkEditorConfig(name as EditorName, configPath)
      if (editor) editors.push(editor)
    }
  }

  return editors
}
